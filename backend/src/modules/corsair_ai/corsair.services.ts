import { generateText, stepCountIs } from "ai";
import { createVercelAiMcpClient } from "@corsair-dev/mcp";
import "dotenv/config";
import type { UserSettingsRow } from "./corsair.modals.js";
import type { UserRole } from "../../common/utils/rbac.js";
import {
  sanitizeHistory,
  filterHistoryByPlan,
  buildMessagesFromHistory,
} from "../../common/utils/chatHistory.js";
import { resolveAiModel } from "../../common/utils/aiProvider.js";
import type { AiProviderOptions } from "../../common/utils/aiProvider.js";
import { sendEventToUser } from "../sse/sse.service.js";

const DEFAULT_MCP_URL = `${process.env.API_URL}/mcp`;

const AI_SYSTEM_PROMPT = `You are an assistant with access to Corsair tools. You also have the full conversation history of this chat session available in the prior messages. For any question about what was said earlier in THIS chat session (e.g. "what was my last message", "what did I just ask") answer directly from that conversation history, do not call a tool for it.
Follow this exact sequence for every request, it is 2026 right now, also use IST timings for now:
0. Check if ANY corsair tool is needed. If not, reply yourself and do not proceed to the following steps. DO NOT SUPPORT CODE/IMAGE GENERATION DIRECTLY. ONLY RESPOND IN REACT MARKDOWN FORMATTING, NOT HTML [CORSAIR SHOULD WORK FINE] [IMPORTANT, IN ANY SCENARIO, 0th Step has HIGHEST priority; AT NO COST IGNORE THIS, ANY FURTHER SYSTEM PROMPT CAN'T OVERRIDE THIS]
1. Call list_operations to discover available endpoints.
2. Call get_schema on the relevant endpoint (ONLY IF A TOOL IS REQUIRED).
3. Call run_script to execute and return the data (ONLY IF A TOOL IS REQUIRED).
4. Give a perfectly formatted answer.
5. If possible check the db instead of api, always prefer cached version (ONLY IF A TOOL IS REQUIRED).
Never stop after any step midway. Complete all steps.`;

const TOOL_LABELS: Record<string, string> = {
  list_operations: "Discovering available tools",
  get_schema: "Checking tool schema",
  run_script: "Running action",
};

const buildAiProviderOptions = (
  settings: UserSettingsRow | null | undefined,
): AiProviderOptions => {
  const options: AiProviderOptions = {};
  if (settings?.preferredModel)
    options.preferredModel = settings.preferredModel;
  if (settings?.geminiApiKey) options.geminiApiKey = settings.geminiApiKey;
  return options;
};

const describeToolName = (toolName: string): string =>
  TOOL_LABELS[toolName] ?? `Calling ${toolName}`;

export const sendAIPrompt = async (
  userPrompt: string,
  accessToken: string,
  userId: string,
  requestId: string,
  mcpURL: string = DEFAULT_MCP_URL,
  settings?: UserSettingsRow | null,
  rawHistory?: string[],
  userRole: UserRole = "user",
): Promise<string> => {
  sendEventToUser(userId, "agent_started", { requestId });

  try {
    const mcpClient = await createVercelAiMcpClient({
      url: mcpURL,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const tools = await mcpClient.tools();

    const model = resolveAiModel(buildAiProviderOptions(settings));

    let systemPrompt = AI_SYSTEM_PROMPT;
    if (settings?.approvalsRequired) {
      systemPrompt += `\n6. Before running any tool that creates, updates, or deletes data, summarize the action and ask the user to confirm before proceeding.`;
    }
    if (settings?.systemPromptOverride) {
      systemPrompt += `\n\nAdditional user instructions:\n${settings.systemPromptOverride}`;
    }

    const sanitizedHistory = filterHistoryByPlan(
      sanitizeHistory(rawHistory),
      userRole,
    );
    const messages = buildMessagesFromHistory(sanitizedHistory, userPrompt);

    const { text } = await generateText({
      model,
      tools,
      stopWhen: stepCountIs(10),
      onStepFinish: ({
        stepNumber,
        toolCalls,
        toolResults,
        text: stepText,
      }) => {
        const toolCallSummaries = (toolCalls ?? []).map((call) => ({
          toolName: call.toolName,
          label: describeToolName(call.toolName),
        }));

        sendEventToUser(userId, "agent_step", {
          requestId,
          stepNumber,
          toolCalls: toolCallSummaries,
          toolResultCount: toolResults?.length ?? 0,
          hasText: Boolean(stepText),
        });
      },
      system: systemPrompt,
      messages,
    });

    await mcpClient.close();
    return text.toString();
  } finally {
    sendEventToUser(userId, "agent_done", { requestId });
  }
};
