import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { ollama } from "ai-sdk-ollama";
import type { LanguageModel } from "ai";

export interface AiProviderOptions {
  useLocalModel?: boolean;
  preferredModel?: string;
  geminiApiKey?: string | null;
}

const DEFAULT_MODEL = "gemini-flash-lite-latest";

export const resolveAiModel = (options: AiProviderOptions): LanguageModel => {
  if (options.useLocalModel) {
    return ollama("gemma4");
  }

  const modelName = options.preferredModel ?? DEFAULT_MODEL;

  if (options.geminiApiKey) {
    const customProvider = createGoogleGenerativeAI({
      apiKey: options.geminiApiKey,
    });
    return customProvider(modelName);
  }

  return google(modelName);
};

export const resolveDefaultModel = (
  geminiApiKey?: string | null,
): LanguageModel => {
  if (geminiApiKey) {
    const customProvider = createGoogleGenerativeAI({ apiKey: geminiApiKey });
    return customProvider(DEFAULT_MODEL);
  }
  return google(DEFAULT_MODEL);
};
