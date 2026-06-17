import { z } from "zod";
// A single key combination, e.g. { key: "k", ctrl: true }
const KeyComboSchema = z.object({
    key: z.string().min(1).max(40),
    ctrl: z.boolean().optional(),
    shift: z.boolean().optional(),
    alt: z.boolean().optional(),
    meta: z.boolean().optional(),
});
// Map of action id -> key combo. Keys are validated as short identifiers
// (e.g. "nav-chat", "toggle-theme") rather than an enum, so new actions can
// be added on the frontend without requiring a backend change.
const KeybindsSchema = z
    .record(z.string().min(1).max(60), KeyComboSchema)
    .refine((obj) => Object.keys(obj).length <= 100, {
    message: "Too many keybinds",
});
export const UpdateSettingsSchema = z.object({
    geminiApiKey: z.string().max(500).nullable().optional(),
    preferredModel: z.string().max(100).optional(),
    useLocalModel: z.boolean().optional(),
    approvalsRequired: z.boolean().optional(),
    systemPromptOverride: z.string().max(4000).nullable().optional(),
    keybinds: KeybindsSchema.optional(),
});
//# sourceMappingURL=settings.modal.js.map