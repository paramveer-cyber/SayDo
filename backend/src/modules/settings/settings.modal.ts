import { z } from "zod";

const KeyComboSchema = z.object({
  key: z.string().min(1).max(40),
  ctrl: z.boolean().optional(),
  shift: z.boolean().optional(),
  alt: z.boolean().optional(),
  meta: z.boolean().optional(),
});

const KeybindsSchema = z
  .record(z.string().min(1).max(60), KeyComboSchema)
  .refine((obj) => Object.keys(obj).length <= 100, {
    message: "Too many keybinds",
  });

export const UpdateSettingsSchema = z.object({
  geminiApiKey: z.string().min(1).max(500).nullable().optional(),
  preferredModel: z.string().min(1).max(100).optional(),
  approvalsRequired: z.boolean().optional(),
  systemPromptOverride: z.string().max(4000).nullable().optional(),
  keybinds: KeybindsSchema.optional(),
});

export type UpdateSettingsBody = z.infer<typeof UpdateSettingsSchema>;
export type KeyCombo = z.infer<typeof KeyComboSchema>;
