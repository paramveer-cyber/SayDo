import { z } from "zod";
export const UpdateSettingsSchema = z.object({
    geminiApiKey: z.string().max(500).nullable().optional(),
    preferredModel: z.string().max(100).optional(),
    useLocalModel: z.boolean().optional(),
    approvalsRequired: z.boolean().optional(),
    systemPromptOverride: z.string().max(4000).nullable().optional(),
});
//# sourceMappingURL=settings.modal.js.map