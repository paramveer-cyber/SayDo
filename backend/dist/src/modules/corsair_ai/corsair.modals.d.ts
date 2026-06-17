import { z } from "zod";
import type { userSettings } from "../../db/schema.js";
export declare const promptBody: z.ZodObject<{
    prompt: z.ZodString;
    useLocalModal: z.ZodBoolean;
    mcpServer: z.ZodOptional<z.ZodURL>;
    options: z.ZodOptional<z.ZodObject<{
        history: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type PromptBody = z.infer<typeof promptBody>;
export type UserSettingsRow = typeof userSettings.$inferSelect;
//# sourceMappingURL=corsair.modals.d.ts.map