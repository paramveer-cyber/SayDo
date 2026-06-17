import { z } from "zod";
const labelIdsSchema = z.preprocess((val) => typeof val === "string"
    ? val.split(",").filter(Boolean)
    : Array.isArray(val)
        ? val
        : undefined, z.array(z.string()).optional());
export const listMessagesQuery = z.object({
    q: z.string().optional(),
    maxResults: z.coerce.number().int().min(1).max(500).optional(),
    pageToken: z.string().optional(),
    labelIds: labelIdsSchema,
    includeSpamTrash: z.coerce.boolean().optional(),
});
export const getMessageQuery = z.object({
    format: z.enum(["full", "minimal", "raw", "metadata"]).optional(),
    metadataHeaders: z.preprocess((val) => typeof val === "string"
        ? val.split(",").filter(Boolean)
        : Array.isArray(val)
            ? val
            : undefined, z.array(z.string()).optional()),
});
export const sendMessageBody = z.object({
    to: z.email(),
    subject: z.string().min(1).max(998),
    body: z.string().min(1),
    threadId: z.string().optional(),
    cc: z.string().optional(),
    bcc: z.string().optional(),
});
export const modifyMessageBody = z.object({
    addLabelIds: z.array(z.string()).optional(),
    removeLabelIds: z.array(z.string()).optional(),
});
export const batchModifyMessagesBody = z.object({
    ids: z.array(z.string()).min(1),
    addLabelIds: z.array(z.string()).optional(),
    removeLabelIds: z.array(z.string()).optional(),
});
export const listThreadsQuery = z.object({
    q: z.string().optional(),
    maxResults: z.coerce.number().int().min(1).max(500).optional(),
    pageToken: z.string().optional(),
    labelIds: labelIdsSchema,
    includeSpamTrash: z.coerce.boolean().optional(),
});
export const getThreadQuery = z.object({
    format: z.enum(["full", "minimal", "metadata"]).optional(),
    metadataHeaders: z.preprocess((val) => typeof val === "string"
        ? val.split(",").filter(Boolean)
        : Array.isArray(val)
            ? val
            : undefined, z.array(z.string()).optional()),
});
export const modifyThreadBody = z.object({
    addLabelIds: z.array(z.string()).optional(),
    removeLabelIds: z.array(z.string()).optional(),
});
export const listDraftsQuery = z.object({
    q: z.string().optional(),
    maxResults: z.coerce.number().int().min(1).max(500).optional(),
    pageToken: z.string().optional(),
});
export const createDraftBody = z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(998),
    body: z.string().min(1),
    threadId: z.string().optional(),
});
export const updateDraftBody = z.object({
    to: z.string().email(),
    subject: z.string().min(1).max(998),
    body: z.string().min(1),
    threadId: z.string().optional(),
});
export const createLabelBody = z.object({
    name: z.string().min(1),
    messageListVisibility: z.enum(["show", "hide"]).optional(),
    labelListVisibility: z
        .enum(["labelShow", "labelShowIfUnread", "labelHide"])
        .optional(),
});
export const updateLabelBody = z.object({
    name: z.string().min(1).optional(),
    messageListVisibility: z.enum(["show", "hide"]).optional(),
    labelListVisibility: z
        .enum(["labelShow", "labelShowIfUnread", "labelHide"])
        .optional(),
});
//# sourceMappingURL=gmail.modals.js.map