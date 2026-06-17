import { z } from "zod";
export declare const UpdateSettingsSchema: z.ZodObject<{
    geminiApiKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    preferredModel: z.ZodOptional<z.ZodString>;
    useLocalModel: z.ZodOptional<z.ZodBoolean>;
    approvalsRequired: z.ZodOptional<z.ZodBoolean>;
    systemPromptOverride: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type UpdateSettingsBody = z.infer<typeof UpdateSettingsSchema>;
//# sourceMappingURL=settings.modal.d.ts.map