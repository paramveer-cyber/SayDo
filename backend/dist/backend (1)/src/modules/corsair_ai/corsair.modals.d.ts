import { z } from "zod";
export declare const promptBody: z.ZodObject<{
    prompt: z.ZodString;
    useLocalModal: z.ZodBoolean;
    mcpServer: z.ZodOptional<z.ZodURL>;
}, z.core.$strip>;
export type PromptBody = z.infer<typeof promptBody>;
//# sourceMappingURL=corsair.modals.d.ts.map