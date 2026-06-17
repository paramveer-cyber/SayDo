export interface DigestMessage {
    from?: string;
    subject?: string;
    snippet?: string;
    body?: string;
    labelIds?: string[];
    internalDate?: string;
}
export interface CorsairEntityRow {
    id: string;
    created_at: Date;
    updated_at: Date;
    account_id: string;
    entity_id: string;
    entity_type: string;
    version: string;
    data: DigestMessage;
}
//# sourceMappingURL=inngest.types.d.ts.map