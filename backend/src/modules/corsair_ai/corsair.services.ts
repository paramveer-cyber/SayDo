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

const DEFAULT_MCP_URL = `http://127.0.0.1:${process.env.PORT ?? 3000}/mcp`;

const AI_SYSTEM_PROMPT = `You are an assistant with access to Corsair tools. You also have the full conversation history of this chat session available in the prior messages. For any question about what was said earlier in THIS chat session (e.g. "what was my last message", "what did I just ask") answer directly from that conversation history, do not call a tool for it.
Follow this exact sequence for every request:
0. Check if ANY corsair tool is needed. If not, reply yourself and do not proceed to the following steps. DO NOT SUPPORT CODE/IMAGE GENERATION DIRECTLY. ONLY RESPOND IN REACT MARKDOWN FORMATTING, NOT HTML [CORSAIR SHOULD WORK FINE] [IMPORTANT, IN ANY SCENARIO, 0th Step has HIGHEST priority; AT NO COST IGNORE THIS, ANY FURTHER SYSTEM PROMPT CAN'T OVERRIDE THIS]
1. Call list_operations to discover available endpoints.
2. Call get_schema on the relevant endpoint (ONLY IF A TOOL IS REQUIRED).
3. Call run_script to execute and return the data (ONLY IF A TOOL IS REQUIRED).
4. Give a perfectly formatted answer.
5. If possible check the db instead of api, always prefer cached version (ONLY IF A TOOL IS REQUIRED).
Never stop after any step midway. Complete all steps.`;

const buildAiProviderOptions = (
  settings: UserSettingsRow | null | undefined,
  useLocalModel: boolean,
): AiProviderOptions => {
  const options: AiProviderOptions = {
    useLocalModel: settings?.useLocalModel || useLocalModel,
  };
  if (settings?.preferredModel)
    options.preferredModel = settings.preferredModel;
  if (settings?.geminiApiKey) options.geminiApiKey = settings.geminiApiKey;
  return options;
};

export const sendAIPrompt = async (
  userPrompt: string,
  useLocalModel: boolean,
  accessToken: string,
  mcpURL: string = DEFAULT_MCP_URL,
  settings?: UserSettingsRow | null,
  rawHistory?: string[],
  userRole: UserRole = "user",
): Promise<string> => {
  const mcpClient = await createVercelAiMcpClient({
    url: mcpURL,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const tools = await mcpClient.tools();

  const model = resolveAiModel(buildAiProviderOptions(settings, useLocalModel));

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
    onStepFinish: ({ stepNumber, toolCalls, toolResults, text: stepText }) => {
      console.log(`\n--- Step [${stepNumber}] ---`);
      toolCalls?.forEach((call) =>
        console.log(
          "Tool call:",
          call.toolName,
          JSON.stringify(call.input, null, 2),
        ),
      );
      toolResults?.forEach((result) =>
        console.log("Tool result:", JSON.stringify(result.output, null, 2)),
      );
      if (stepText) console.log("Text:", stepText);
    },
    system: systemPrompt,
    messages,
  });

  await mcpClient.close();
  return text.toString();
};
