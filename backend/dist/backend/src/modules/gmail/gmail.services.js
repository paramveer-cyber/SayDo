const buildRawEmailBase64 = (fields) => {
    const lines = [
        `To: ${fields.to}`,
        `Subject: ${fields.subject}`,
        fields.cc ? `Cc: ${fields.cc}` : null,
        fields.bcc ? `Bcc: ${fields.bcc}` : null,
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
const normalizeStringArray = (val) => {
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
    const limit = toNumber(query.maxResults, 100);
    const offset = toNumber(query.pageOffset, 0);
    const filters = {};
    if (query.q !== undefined) {
        filters.snippet = { contains: String(query.q) };
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
    const labelIds = normalizeLabelIds(query.labelIds);
    if (!labelIds || labelIds.length === 0) {
        const rows = await tenantCorsair.gmail.db.messages.search({
            data: filters,
            limit,
            offset,
        });
        return rows;
    }
    // `labelIds` is a JSON array field on the message data, which the ORM's
    // search filters can't match against directly (only string/number/boolean/
    // date fields are supported there), so fetch a broader page and apply the
    // label filter in memory before paginating.
    const rows = await tenantCorsair.gmail.db.messages.search({
        data: filters,
        limit: 1000,
        offset: 0,
    });
    const filtered = rows.filter((row) => labelIds.every((label) => row.data?.labelIds?.includes(label)));
    return filtered.slice(offset, offset + limit);
};
export const getMessage = (tenantCorsair, messageId, query) => tenantCorsair.gmail.db.messages
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
export const getThread = (tenantCorsair, threadId, query) => tenantCorsair.gmail.db.threads
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
    return rows;
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
export const listLabels = async (tenantCorsair, query = {}) => {
    const limit = toNumber(query.maxResults, 100);
    const offset = toNumber(query.pageOffset, 0);
    const filters = {};
    if (query.name !== undefined) {
        filters.name = { contains: String(query.name) };
    }
    const rows = await tenantCorsair.gmail.db.labels.search({
        data: filters,
        limit,
        offset,
    });
    return rows;
};
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
//# sourceMappingURL=gmail.services.js.map