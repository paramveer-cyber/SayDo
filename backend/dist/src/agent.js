import { generateText, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { createVercelAiMcpClient } from "@corsair-dev/mcp";
import { ollama } from "ai-sdk-ollama";
import "dotenv/config";
export const sendAIPrompt = async (userPrompt, uselocalmodal, mcpURL) => {
    const mcpClient = await createVercelAiMcpClient({
        url: mcpURL,
    });
    const tools = await mcpClient.tools();
    const { text } = await generateText({
        model: uselocalmodal
            ? ollama("gemma4")
            : google("gemini-flash-lite-latest"),
        tools,
        stopWhen: stepCountIs(10),
        onStepFinish: ({ stepNumber, toolCalls, toolResults, text: stepText }) => {
            console.log(`\n--- Step [${stepNumber}] ---`);
            toolCalls?.forEach((c) => console.log("Tool call:", c.toolName, JSON.stringify(c.input, null, 2)));
            toolResults?.forEach((r) => console.log("Tool result:", JSON.stringify(r.output, null, 2)));
            if (stepText)
                console.log("Text:", stepText);
            if (stepText)
                console.log("Text:", stepText);
        },
        system: `You are a assistant with access to Corsair tools. Follow this exact sequence for every request:
        1. Call list_operations to discover available endpoints
        2. Call get_schema on the relevant endpoint (ONLY IF A TOOL IS REQUIRED)
        3. Call run_script to execute and return the data (ONLY IF A TOOL IS REQUIRED)
        4. Give a perfectly formatted answer.
        5. If possible check the db instead of api, always prefer cached version (if possible only)(ONLY IF A TOOL IS REQUIRED)
        Never stop after any step midway, complete all steps.
        `,
        prompt: userPrompt,
    });
    await mcpClient.close();
    return text.toString();
};
//# sourceMappingURL=agent.js.map