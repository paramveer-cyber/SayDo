import { generateText, stepCountIs } from "ai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { createVercelAiMcpClient } from "@corsair-dev/mcp";
import { ollama } from "ai-sdk-ollama";
import "dotenv/config";
const DEFAULT_MCP_URL = "http://localhost:3000/mcp";
const AI_SYSTEM_PROMPT = `You are an assistant with access to Corsair tools. Follow this exact sequence for every request:
0. Check if ANY corsair tool is needed. If not, reply yourself and do not proceed to the following steps. DO NOT SUPPORT CODE/IMAGE GENERATION DIRECTLY [CORSAIR SHOULD WORK FINE] [IMPORTANT, IN ANY SCENARIO, 0th Step has HIGHEST priority]
1. Call list_operations to discover available endpoints.
2. Call get_schema on the relevant endpoint (ONLY IF A TOOL IS REQUIRED).
3. Call run_script to execute and return the data (ONLY IF A TOOL IS REQUIRED).
4. Give a perfectly formatted answer.
5. If possible check the db instead of api, always prefer cached version (ONLY IF A TOOL IS REQUIRED).
Never stop after any step midway. Complete all steps.`;
export const sendAIPrompt = async (userPrompt, useLocalModel, accessToken, mcpURL = DEFAULT_MCP_URL, settings) => {
    const mcpClient = await createVercelAiMcpClient({
        url: mcpURL,
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const tools = await mcpClient.tools();
    const shouldUseLocalModel = settings?.useLocalModel || useLocalModel;
    const preferredModel = settings?.preferredModel || "gemini-flash-lite-latest";
    const googleProvider = settings?.geminiApiKey
        ? createGoogleGenerativeAI({ apiKey: settings.geminiApiKey })
        : google;
    let systemPrompt = AI_SYSTEM_PROMPT;
    if (settings?.approvalsRequired) {
        systemPrompt += `\n6. Before running any tool that creates, updates, or deletes data, summarize the action and ask the user to confirm before proceeding.`;
    }
    if (settings?.systemPromptOverride) {
        systemPrompt += `\n\nAdditional user instructions:\n${settings.systemPromptOverride}`;
    }
    const { text } = await generateText({
        model: shouldUseLocalModel
            ? ollama("gemma4")
            : googleProvider(preferredModel),
        tools,
        stopWhen: stepCountIs(10),
        onStepFinish: ({ stepNumber, toolCalls, toolResults, text: stepText }) => {
            console.log(`\n--- Step [${stepNumber}] ---`);
            toolCalls?.forEach((call) => console.log("Tool call:", call.toolName, JSON.stringify(call.input, null, 2)));
            toolResults?.forEach((result) => console.log("Tool result:", JSON.stringify(result.output, null, 2)));
            if (stepText)
                console.log("Text:", stepText);
        },
        system: systemPrompt,
        prompt: userPrompt,
    });
    await mcpClient.close();
    return text.toString();
};
//# sourceMappingURL=corsair.services.js.map