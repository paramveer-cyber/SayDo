import { z } from "zod";
declare const KeyComboSchema: z.ZodObject<{
    key: z.ZodString;
    ctrl: z.ZodOptional<z.ZodBoolean>;
    shift: z.ZodOptional<z.ZodBoolean>;
    alt: z.ZodOptional<z.ZodBoolean>;
    meta: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const UpdateSettingsSchema: z.ZodObject<{
    geminiApiKey: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    preferredModel: z.ZodOptional<z.ZodString>;
    approvalsRequired: z.ZodOptional<z.ZodBoolean>;
    systemPromptOverride: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    keybinds: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        key: z.ZodString;
        ctrl: z.ZodOptional<z.ZodBoolean>;
        shift: z.ZodOptional<z.ZodBoolean>;
        alt: z.ZodOptional<z.ZodBoolean>;
        meta: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type UpdateSettingsBody = z.infer<typeof UpdateSettingsSchema>;
export type KeyCombo = z.infer<typeof KeyComboSchema>;
export {};
//# sourceMappingURL=settings.modal.d.ts.map