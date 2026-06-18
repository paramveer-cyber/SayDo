import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
const DEFAULT_MODEL = "gemini-flash-lite-latest";
export const resolveAiModel = (options) => {
    const modelName = options.preferredModel ?? DEFAULT_MODEL;
    if (options.geminiApiKey) {
        const customProvider = createGoogleGenerativeAI({
            apiKey: options.geminiApiKey,
        });
        return customProvider(modelName);
    }
    return google(modelName);
};
export const resolveDefaultModel = (geminiApiKey) => {
    if (geminiApiKey) {
        const customProvider = createGoogleGenerativeAI({ apiKey: geminiApiKey });
        return customProvider(DEFAULT_MODEL);
    }
    return google(DEFAULT_MODEL);
};
//# sourceMappingURL=aiProvider.js.map