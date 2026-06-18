import { z } from "zod";
const labelIdsSchema = z.preprocess((val) => typeof val === "string"
    ? val.split(",").filter(Boolean)
    : Array.isArray(val)
        ? val
        : undefined, z.array(z.string().min(1)).optional());
const metadataHeadersSchema = z.preprocess((val) => typeof val === "string"
    ? val.split(",").filter(Boolean)
    : Array.isArray(val)
        ? val
        : undefined, z.array(z.string().min(1)).optional());
export const listMessagesQuery = z.object({
    q: z.string().max(500).optional(),
    maxResults: z.coerce.number().int().min(1).max(500).optional(),
    pageToken: z.string().max(200).optional(),
    labelIds: labelIdsSchema,
    includeSpamTrash: z.coerce.boolean().optional(),
});
export const getMessageQuery = z.object({
    format: z.enum(["full", "minimal", "raw", "metadata"]).optional(),
    metadataHeaders: metadataHeadersSchema,
});
export const sendMessageBody = z.object({
    to: z.email("Invalid recipient email"),
    subject: z.string().min(1, "Subject is required").max(998),
    body: z.string().min(1, "Body is required").max(100_000),
    threadId: z.string().max(200).optional(),
    cc: z.email("Invalid CC email").optional(),
    bcc: z.email("Invalid BCC email").optional(),
});
export const modifyMessageBody = z
    .object({
    addLabelIds: z.array(z.string().min(1)).max(100).optional(),
    removeLabelIds: z.array(z.string().min(1)).max(100).optional(),
})
    .refine((data) => data.addLabelIds?.length || data.removeLabelIds?.length, {
    message: "At least one of addLabelIds or removeLabelIds must be provided",
});
export const batchModifyMessagesBody = z.object({
    ids: z.array(z.string().min(1)).min(1).max(1000),
    addLabelIds: z.array(z.string().min(1)).max(100).optional(),
    removeLabelIds: z.array(z.string().min(1)).max(100).optional(),
});
export const listThreadsQuery = z.object({
    q: z.string().max(500).optional(),
    maxResults: z.coerce.number().int().min(1).max(500).optional(),
    pageToken: z.string().max(200).optional(),
    labelIds: labelIdsSchema,
    includeSpamTrash: z.coerce.boolean().optional(),
});
export const getThreadQuery = z.object({
    format: z.enum(["full", "minimal", "metadata"]).optional(),
    metadataHeaders: metadataHeadersSchema,
});
export const modifyThreadBody = z
    .object({
    addLabelIds: z.array(z.string().min(1)).max(100).optional(),
    removeLabelIds: z.array(z.string().min(1)).max(100).optional(),
})
    .refine((data) => data.addLabelIds?.length || data.removeLabelIds?.length, {
    message: "At least one of addLabelIds or removeLabelIds must be provided",
});
export const listDraftsQuery = z.object({
    q: z.string().max(500).optional(),
    maxResults: z.coerce.number().int().min(1).max(500).optional(),
    pageToken: z.string().max(200).optional(),
});
export const createDraftBody = z.object({
    to: z.string().email("Invalid recipient email"),
    subject: z.string().min(1, "Subject is required").max(998),
    body: z.string().min(1, "Body is required").max(100_000),
    threadId: z.string().max(200).optional(),
});
export const updateDraftBody = z.object({
    to: z.string().email("Invalid recipient email"),
    subject: z.string().min(1, "Subject is required").max(998),
    body: z.string().min(1, "Body is required").max(100_000),
    threadId: z.string().max(200).optional(),
});
export const createLabelBody = z.object({
    name: z.string().min(1, "Label name is required").max(225),
    messageListVisibility: z.enum(["show", "hide"]).optional(),
    labelListVisibility: z
        .enum(["labelShow", "labelShowIfUnread", "labelHide"])
        .optional(),
});
export const updateLabelBody = z.object({
    name: z.string().min(1).max(225).optional(),
    messageListVisibility: z.enum(["show", "hide"]).optional(),
    labelListVisibility: z
        .enum(["labelShow", "labelShowIfUnread", "labelHide"])
        .optional(),
});
//# sourceMappingURL=gmail.modals.js.map