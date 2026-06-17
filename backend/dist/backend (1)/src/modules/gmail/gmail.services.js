const HEADER_CONTROL_CHARS = /[\x00-\x1f\x7f\u2028\u2029]/g;
const sanitizeHeaderValue = (value) => value.replace(HEADER_CONTROL_CHARS, "").trim();
const sanitizeEmailAddress = (value) => {
    const sanitized = sanitizeHeaderValue(value);
    const firstAddress = sanitized.split(/\s*,\s*/)[0] ?? "";
    return firstAddress;
};
const sanitizeSubject = (value) => {
    const sanitized = sanitizeHeaderValue(value);
    return sanitized.slice(0, 988);
};
export const buildRawEmailBase64 = (fields) => {
    const lines = [
        `To: ${sanitizeEmailAddress(fields.to)}`,
        `Subject: ${sanitizeSubject(fields.subject)}`,
        fields.cc ? `Cc: ${sanitizeEmailAddress(fields.cc)}` : null,
        fields.bcc ? `Bcc: ${sanitizeEmailAddress(fields.bcc)}` : null,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        fields.body,
    ]
        .filter(Boolean)
        .join("\r\n");
    return Buffer.from(lines).toString("base64url");
};
const normalizeLabelIds = (val) => {
    if (!val)
        return undefined;
    if (Array.isArray(val))
        return val;
    if (typeof val === "string")
        return val.split(",").filter(Boolean);
    return undefined;
};
const toNumber = (val, fallback) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
};
export const listMessages = async (tenantCorsair, query) => {
    const limit = toNumber(query.maxResults, 20);
    const offset = toNumber(query.pageOffset, 0);
    const filters = {};
    if (query.q !== undefined) {
        const searchTerm = String(query.q);
        filters.$or = [
            { snippet: { contains: searchTerm } },
            { subject: { contains: searchTerm } },
            { from: { contains: searchTerm } },
        ];
    }
    if (query.threadId !== undefined) {
        filters.threadId = { equals: String(query.threadId) };
    }
    if (query.from !== undefined) {
        filters.from = { contains: String(query.from) };
    }
    if (query.to !== undefined) {
        filters.to = { contains: String(query.to) };
    }
    if (query.subject !== undefined) {
        filters.subject = { contains: String(query.subject) };
    }
    if (query.labelIds !== undefined) {
        filters.labelIds = { contains: String(query.labelIds) };
    }
    const rows = await tenantCorsair.gmail.db.messages.search({
        data: filters,
        limit,
        offset,
    });
    return rows;
};
export const getMessage = (tenantCorsair, messageId) => tenantCorsair.gmail.db.messages
    .search({
    data: { id: { equals: messageId } },
    limit: 1,
    offset: 0,
})
    .then((rows) => rows[0] ?? null);
export const sendMessage = (tenantCorsair, fields) => tenantCorsair.gmail.api.messages.send({
    raw: buildRawEmailBase64(fields),
    ...(fields.threadId !== undefined && { threadId: fields.threadId }),
});
export const deleteMessage = (tenantCorsair, messageId) => tenantCorsair.gmail.api.messages.delete({ id: messageId });
export const trashMessage = (tenantCorsair, messageId) => tenantCorsair.gmail.api.messages.trash({ id: messageId });
export const untrashMessage = (tenantCorsair, messageId) => tenantCorsair.gmail.api.messages.untrash({ id: messageId });
export const modifyMessage = (tenantCorsair, messageId, fields) => tenantCorsair.gmail.api.messages.modify({
    id: messageId,
    ...(fields.addLabelIds !== undefined && {
        addLabelIds: fields.addLabelIds,
    }),
    ...(fields.removeLabelIds !== undefined && {
        removeLabelIds: fields.removeLabelIds,
    }),
});
export const batchModifyMessages = (tenantCorsair, fields) => tenantCorsair.gmail.api.messages.batchModify({
    ids: fields.ids,
    ...(fields.addLabelIds !== undefined && {
        addLabelIds: fields.addLabelIds,
    }),
    ...(fields.removeLabelIds !== undefined && {
        removeLabelIds: fields.removeLabelIds,
    }),
});
export const listThreads = async (tenantCorsair, query) => {
    const limit = toNumber(query.maxResults, 100);
    const offset = toNumber(query.pageOffset, 0);
    const filters = {};
    if (query.q !== undefined) {
        filters.snippet = { contains: String(query.q) };
    }
    const rows = await tenantCorsair.gmail.db.threads.search({
        data: filters,
        limit,
        offset,
    });
    return rows;
};
export const getThread = (tenantCorsair, threadId) => tenantCorsair.gmail.db.threads
    .search({
    data: { id: { equals: threadId } },
    limit: 1,
    offset: 0,
})
    .then((rows) => rows[0] ?? null);
export const modifyThread = (tenantCorsair, threadId, fields) => tenantCorsair.gmail.api.threads.modify({
    id: threadId,
    ...(fields.addLabelIds !== undefined && {
        addLabelIds: fields.addLabelIds,
    }),
    ...(fields.removeLabelIds !== undefined && {
        removeLabelIds: fields.removeLabelIds,
    }),
});
export const trashThread = (tenantCorsair, threadId) => tenantCorsair.gmail.api.threads.trash({ id: threadId });
export const untrashThread = (tenantCorsair, threadId) => tenantCorsair.gmail.api.threads.untrash({ id: threadId });
export const deleteThread = (tenantCorsair, threadId) => tenantCorsair.gmail.api.threads.delete({ id: threadId });
const extractHeader = (headers, name) => headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    "";
const normalizeDraft = (raw) => {
    const headers = raw?.message?.payload?.headers;
    return {
        id: raw.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        account_id: "",
        entity_id: raw.id,
        entity_type: "drafts",
        version: "1",
        data: {
            id: raw.id,
            message: {
                id: raw.message?.id ?? raw.id,
                ...(raw.message?.threadId !== undefined && {
                    threadId: raw.message.threadId,
                }),
                snippet: raw.message?.snippet ?? "",
                from: extractHeader(headers, "from"),
                to: extractHeader(headers, "to"),
                subject: extractHeader(headers, "subject"),
                body: "",
            },
        },
    };
};
export const listDrafts = async (tenantCorsair, query) => {
    const limit = toNumber(query.maxResults, 100);
    const offset = toNumber(query.pageOffset, 0);
    const filters = {};
    if (query.messageId !== undefined) {
        filters.messageId = { equals: String(query.messageId) };
    }
    const rows = await tenantCorsair.gmail.db.drafts.search({
        data: filters,
        limit,
        offset,
    });
    const rawDrafts = await Promise.all(rows.map((row) => tenantCorsair.gmail.api.drafts.get({ id: row.data.id })));
    return rawDrafts.map(normalizeDraft);
};
export const getDraft = (tenantCorsair, draftId) => tenantCorsair.gmail.db.drafts
    .search({
    data: { id: { equals: draftId } },
    limit: 1,
    offset: 0,
})
    .then((rows) => rows[0] ?? null);
export const createDraft = (tenantCorsair, fields) => tenantCorsair.gmail.api.drafts.create({
    draft: {
        message: {
            raw: buildRawEmailBase64(fields),
            ...(fields.threadId !== undefined && { threadId: fields.threadId }),
        },
    },
});
export const updateDraft = (tenantCorsair, draftId, fields) => tenantCorsair.gmail.api.drafts.update({
    id: draftId,
    draft: {
        message: {
            raw: buildRawEmailBase64(fields),
            ...(fields.threadId !== undefined && { threadId: fields.threadId }),
        },
    },
});
export const deleteDraft = (tenantCorsair, draftId) => tenantCorsair.gmail.api.drafts.delete({ id: draftId });
export const sendDraft = (tenantCorsair, draftId) => tenantCorsair.gmail.api.drafts.send({ id: draftId });
export const listLabels = (tenantCorsair) => tenantCorsair.gmail.api.labels.list();
export const getLabel = (tenantCorsair, labelId) => tenantCorsair.gmail.db.labels
    .search({
    data: { id: { equals: labelId } },
    limit: 1,
    offset: 0,
})
    .then((rows) => rows[0] ?? null);
export const createLabel = (tenantCorsair, fields) => tenantCorsair.gmail.api.labels.create({
    label: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.messageListVisibility !== undefined && {
            messageListVisibility: fields.messageListVisibility,
        }),
        ...(fields.labelListVisibility !== undefined && {
            labelListVisibility: fields.labelListVisibility,
        }),
    },
});
export const deleteLabel = (tenantCorsair, labelId) => tenantCorsair.gmail.api.labels.delete({ id: labelId });
export const updateLabel = (tenantCorsair, labelId, fields) => tenantCorsair.gmail.api.labels.update({
    id: labelId,
    label: {
        ...(fields.name !== undefined && { name: fields.name }),
        ...(fields.messageListVisibility !== undefined && {
            messageListVisibility: fields.messageListVisibility,
        }),
        ...(fields.labelListVisibility !== undefined && {
            labelListVisibility: fields.labelListVisibility,
        }),
    },
});
export const syncAllMessages = async (tenantCorsair, query) => {
    console.log("Syncing messages...", query);
    const maxResults = toNumber(query.maxResults, 10);
    const maxPages = toNumber(query.maxPages, 2);
    const fetchFull = query.fetchFull === undefined ||
        query.fetchFull === "true" ||
        query.fetchFull === true;
    const labelIds = normalizeLabelIds(query.labelIds);
    const q = query.q !== undefined ? String(query.q) : undefined;
    const messageIds = [];
    let pageToken;
    let pagesFetched = 0;
    do {
        const listResult = await tenantCorsair.gmail.api.messages.list({
            maxResults,
            ...(q !== undefined && { q }),
            ...(labelIds !== undefined && { labelIds }),
            ...(pageToken !== undefined && { pageToken }),
        });
        console.log(`API threadids: ${listResult} , page: ${pagesFetched}`);
        for (const message of listResult.messages ?? []) {
            if (message.id)
                messageIds.push(message.id);
        }
        pageToken = listResult.nextPageToken;
        pagesFetched += 1;
    } while (pageToken && pagesFetched < maxPages);
    if (!fetchFull) {
        return { totalMessages: messageIds.length, syncedInFull: 0, pagesFetched };
    }
    const batchSize = 10;
    let syncedInFull = 0;
    for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        console.log("BATCH: ", i);
        await Promise.all(batch.map((id) => tenantCorsair.gmail.api.messages.get({ id, format: "metadata" })));
        syncedInFull += batch.length;
    }
    return { totalMessages: messageIds.length, syncedInFull, pagesFetched };
};
//# sourceMappingURL=gmail.services.js.map