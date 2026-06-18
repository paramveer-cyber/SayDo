import { z } from "zod";
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_ITEM_LENGTH = 4000;
export const promptBody = z.object({
    prompt: z
        .string()
        .min(1, "Prompt cannot be empty")
        .max(4096, "Prompt too long"),
    mcpServer: z.url().optional(),
    requestId: z.string().uuid("requestId must be a valid UUID").optional(),
    options: z
        .object({
        history: z
            .array(z.string().max(MAX_HISTORY_ITEM_LENGTH))
            .max(MAX_HISTORY_ITEMS)
            .optional(),
    })
        .optional(),
});
//# sourceMappingURL=corsair.modals.js.map