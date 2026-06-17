import { z } from "zod";
export const promptBody = z.object({
    prompt: z.string().min(1).max(512),
    useLocalModal: z.boolean(),
    mcpServer: z.url().optional(),
});
//# sourceMappingURL=corsair.modals.js.map