export interface CorsairDbRow<TData> {
    id: string;
    created_at: Date;
    updated_at: Date;
    account_id: string;
    entity_id: string;
    entity_type: string;
    version: string;
    data: TData;
}
export interface GmailMessageData {
    id: string;
    threadId?: string;
    labelIds?: string[];
    snippet?: string;
    historyId?: string;
    internalDate?: string;
    from?: string;
    to?: string;
    subject?: string;
    body?: string;
}
export interface GmailThreadData {
    id: string;
    snippet?: string;
    historyId?: string;
}
export interface GmailDraftMessageData {
    id: string;
    threadId?: string;
    snippet: string;
    from?: string;
    to: string;
    subject: string;
    body: string;
}
export interface GmailDraftData {
    id: string;
    messageId?: string;
    createdAt?: Date;
    message?: GmailDraftMessageData;
}
export interface GmailLabelColor {
    textColor?: string;
    backgroundColor?: string;
}
export interface GmailLabelData {
    id: string;
    name: string;
    type?: string;
    messageListVisibility?: string;
    labelListVisibility?: string;
    messagesTotal?: number;
    messagesUnread?: number;
    color?: GmailLabelColor;
}
export interface RawGmailDraftApiResponse {
    id: string;
    message?: {
        id?: string;
        threadId?: string;
        snippet?: string;
        payload?: {
            headers?: {
                name: string;
                value: string;
            }[];
        };
    };
}
export interface GmailLabelsListApiResponse {
    labels?: GmailLabelData[];
}
export type GmailLabelsListResult = GmailLabelData[] | GmailLabelsListApiResponse;
export interface NormalizedDraft {
    id: string;
    created_at: string;
    updated_at: string;
    account_id: string;
    entity_id: string;
    entity_type: "drafts";
    version: string;
    data: {
        id: string;
        message: GmailDraftMessageData;
    };
}
export interface NormalizedLabel {
    id: string;
    created_at: string;
    updated_at: string;
    account_id: string;
    entity_id: string;
    entity_type: "labels";
    version: string;
    data: GmailLabelData;
}
export interface CorsairDbMessageFilter {
    $or?: Array<Record<string, {
        contains: string;
    }>>;
    threadId?: {
        equals: string;
    };
    from?: {
        contains: string;
    };
    to?: {
        contains: string;
    };
    subject?: {
        contains: string;
    };
    labelIds?: {
        contains: string;
    };
    snippet?: {
        contains: string;
    };
    id?: {
        equals: string;
    };
    historyId?: {
        equals: string;
    };
}
export interface CorsairDbThreadFilter {
    snippet?: {
        contains: string;
    };
    id?: {
        equals: string;
    };
}
export interface CorsairDbDraftFilter {
    messageId?: {
        equals: string;
    };
    id?: {
        equals: string;
    };
}
export interface CorsairDbLabelFilter {
    id?: {
        equals: string;
    };
    name?: {
        contains: string;
    };
}
export interface ListMessagesServiceQuery {
    q?: string;
    maxResults?: number;
    pageOffset?: number;
    threadId?: string;
    from?: string;
    to?: string;
    subject?: string;
    labelIds?: string | string[];
}
export interface ListThreadsServiceQuery {
    q?: string;
    maxResults?: number;
    pageOffset?: number;
}
export interface ListDraftsServiceQuery {
    messageId?: string;
    maxResults?: number;
    pageOffset?: number;
}
export interface SyncMessagesQuery {
    maxResults?: number;
    maxPages?: number;
    fetchFull?: boolean | string;
    labelIds?: string | string[];
    q?: string;
}
export interface SyncMessagesResult {
    totalMessages: number;
    syncedInFull: number;
    pagesFetched: number;
}
//# sourceMappingURL=gmail.types.d.ts.map