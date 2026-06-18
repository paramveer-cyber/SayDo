import type { LanguageModel } from "ai";
export interface AiProviderOptions {
    preferredModel?: string;
    geminiApiKey?: string | null;
}
export declare const resolveAiModel: (options: AiProviderOptions) => LanguageModel;
export declare const resolveDefaultModel: (geminiApiKey?: string | null) => LanguageModel;
//# sourceMappingURL=aiProvider.d.ts.map