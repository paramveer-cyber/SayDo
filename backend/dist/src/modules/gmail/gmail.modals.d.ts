import { z } from "zod";
export declare const listMessagesQuery: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    maxResults: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageToken: z.ZodOptional<z.ZodString>;
    labelIds: z.ZodPreprocess<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    includeSpamTrash: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export declare const getMessageQuery: z.ZodObject<{
    format: z.ZodOptional<z.ZodEnum<{
        raw: "raw";
        full: "full";
        minimal: "minimal";
        metadata: "metadata";
    }>>;
    metadataHeaders: z.ZodPreprocess<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const sendMessageBody: z.ZodObject<{
    to: z.ZodEmail;
    subject: z.ZodString;
    body: z.ZodString;
    threadId: z.ZodOptional<z.ZodString>;
    cc: z.ZodOptional<z.ZodEmail>;
    bcc: z.ZodOptional<z.ZodEmail>;
}, z.core.$strip>;
export declare const modifyMessageBody: z.ZodObject<{
    addLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    removeLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const batchModifyMessagesBody: z.ZodObject<{
    ids: z.ZodArray<z.ZodString>;
    addLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    removeLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const listThreadsQuery: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    maxResults: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageToken: z.ZodOptional<z.ZodString>;
    labelIds: z.ZodPreprocess<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    includeSpamTrash: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export declare const getThreadQuery: z.ZodObject<{
    format: z.ZodOptional<z.ZodEnum<{
        full: "full";
        minimal: "minimal";
        metadata: "metadata";
    }>>;
    metadataHeaders: z.ZodPreprocess<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const modifyThreadBody: z.ZodObject<{
    addLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    removeLabelIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const listDraftsQuery: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    maxResults: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageToken: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createDraftBody: z.ZodObject<{
    to: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
    threadId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateDraftBody: z.ZodObject<{
    to: z.ZodString;
    subject: z.ZodString;
    body: z.ZodString;
    threadId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createLabelBody: z.ZodObject<{
    name: z.ZodString;
    messageListVisibility: z.ZodOptional<z.ZodEnum<{
        show: "show";
        hide: "hide";
    }>>;
    labelListVisibility: z.ZodOptional<z.ZodEnum<{
        labelShow: "labelShow";
        labelShowIfUnread: "labelShowIfUnread";
        labelHide: "labelHide";
    }>>;
}, z.core.$strip>;
export declare const updateLabelBody: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    messageListVisibility: z.ZodOptional<z.ZodEnum<{
        show: "show";
        hide: "hide";
    }>>;
    labelListVisibility: z.ZodOptional<z.ZodEnum<{
        labelShow: "labelShow";
        labelShowIfUnread: "labelShowIfUnread";
        labelHide: "labelHide";
    }>>;
}, z.core.$strip>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuery>;
export type GetMessageQuery = z.infer<typeof getMessageQuery>;
export type SendMessageBody = z.infer<typeof sendMessageBody>;
export type ModifyMessageBody = z.infer<typeof modifyMessageBody>;
export type BatchModifyMessagesBody = z.infer<typeof batchModifyMessagesBody>;
export type ListThreadsQuery = z.infer<typeof listThreadsQuery>;
export type GetThreadQuery = z.infer<typeof getThreadQuery>;
export type ModifyThreadBody = z.infer<typeof modifyThreadBody>;
export type ListDraftsQuery = z.infer<typeof listDraftsQuery>;
export type CreateDraftBody = z.infer<typeof createDraftBody>;
export type UpdateDraftBody = z.infer<typeof updateDraftBody>;
export type CreateLabelBody = z.infer<typeof createLabelBody>;
export type UpdateLabelBody = z.infer<typeof updateLabelBody>;
//# sourceMappingURL=gmail.modals.d.ts.map