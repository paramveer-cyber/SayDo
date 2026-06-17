import { z } from "zod";
import type { userSettings } from "../../db/schema.js";

const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_ITEM_LENGTH = 4000;

export const promptBody = z.object({
  prompt: z.string().min(1).max(512),
  useLocalModal: z.boolean(),
  mcpServer: z.url().optional(),
  options: z
    .object({
      history: z
        .array(z.string().max(MAX_HISTORY_ITEM_LENGTH))
        .max(MAX_HISTORY_ITEMS)
        .optional(),
    })
    .optional(),
});

export type PromptBody = z.infer<typeof promptBody>;
export type UserSettingsRow = typeof userSettings.$inferSelect;
