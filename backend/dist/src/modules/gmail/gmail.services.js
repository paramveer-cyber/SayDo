import { z } from "zod";
import { ApiError } from "../../common/utils/api-error.js";
import { getPubSubAccessToken } from "../../common/config/pubsub.client.js";
const HEADER_CONTROL_CHARS = /[\x00-\x1f\x7f\u2028\u2029]/g;
const sanitizeHeaderValue = (value) => value.replace(HEADER_CONTROL_CHARS, "").trim();
const emailAddressSchema = z.email();
const sanitizeEmailAddress = (value) => {
    const sanitized = sanitizeHeaderValue(value);
    const firstAddress = sanitized.split(/\s*,\s*/)[0] ?? "";
    const parsedAddress = emailAddressSchema.safeParse(firstAddress);
    if (!parsedAddress.success) {
        throw ApiError.badRequest(`Invalid email address: ${firstAddress}`);
    }
    return parsedAddress.data;
};
const sanitizeSubject = (value) => {
    const sanitized = sanitizeHeaderValue(value);
    return sanitized.slice(0, 988);
};
export const buildRawEmailBase64 = (fields) => {
    const emailHeaders = [
        `To: ${sanitizeEmailAddress(fields.to)}`,
        `Subject: ${sanitizeSubject(fields.subject)}`,
        fields.cc ? `Cc: ${sanitizeEmailAddress(fields.cc)}` : null,
        fields.bcc ? `Bcc: ${sanitizeEmailAddress(fields.bcc)}` : null,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
    ]
        .filter(Boolean)
        .join("\r\n");
    const lines = `${emailHeaders}\r\n\r\n${fields.body}`;
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
export const batchModifyMessages = async (tenantCorsair, fields) => {
    await tenantCorsair.gmail.api.messages.batchModify({
        ids: fields.ids,
        ...(fields.addLabelIds !== undefined && {
            addLabelIds: fields.addLabelIds,
        }),
        ...(fields.removeLabelIds !== undefined && {
            removeLabelIds: fields.removeLabelIds,
        }),
    });
    await Promise.all(fields.ids.map((messageId) => tenantCorsair.gmail.api.messages.get({ id: messageId }).catch(() => { })));
};
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
    const listResult = await tenantCorsair.gmail.api.drafts.list({
        maxResults: limit,
    });
    const draftStubs = listResult?.drafts ?? [];
    if (draftStubs.length === 0)
        return [];
    const rawDrafts = await Promise.allSettled(draftStubs.map((stub) => tenantCorsair.gmail.api.drafts.get({ id: stub.id })));
    return rawDrafts
        .filter((r) => r.status === "fulfilled")
        .map((r) => normalizeDraft(r.value));
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
        await Promise.all(batch.map((id) => tenantCorsair.gmail.api.messages.get({ id, format: "metadata" })));
        syncedInFull += batch.length;
    }
    // prodn log
    console.log(`gmail sync done: total=${messageIds.length} synced=${syncedInFull} pages=${pagesFetched}`);
    return { totalMessages: messageIds.length, syncedInFull, pagesFetched };
};
const parseProjectFromTopicName = (topicName) => {
    const match = topicName.match(/^projects\/([^/]+)\/topics\/[^/]+$/);
    if (!match || !match[1]) {
        throw new Error(`GMAIL_PUBSUB_TOPIC must be a full resource name like "projects/{project}/topics/{topic}", got: ${topicName}`);
    }
    return match[1];
};
const ensureGmailPubSubSubscription = async (tenantId) => {
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    const projectId = parseProjectFromTopicName(topicName);
    const pushEndpoint = `${process.env.PUBLISHED_API_URL}/webhooks?tenant=${tenantId}`;
    const subscriptionName = `projects/${projectId}/subscriptions/gmail-watch-${tenantId}`;
    const accessToken = await getPubSubAccessToken();
    const createResponse = await fetch(`https://pubsub.googleapis.com/v1/${subscriptionName}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            topic: topicName,
            pushConfig: { pushEndpoint },
            retryPolicy: {
                minimumBackoff: "10s",
                maximumBackoff: "600s",
            },
        }),
    });
    if (createResponse.ok) {
        // prodn log
        console.info(`pubsub subscription created: tenant=${tenantId}`);
        return;
    }
    const alreadyExists = createResponse.status === 409;
    if (!alreadyExists) {
        const err = await createResponse.text();
        throw new Error(`Pub/Sub subscription setup failed: ${err}`);
    }
    const modifyResponse = await fetch(`https://pubsub.googleapis.com/v1/${subscriptionName}:modifyPushConfig`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushConfig: { pushEndpoint } }),
    });
    if (!modifyResponse.ok) {
        const err = await modifyResponse.text();
        throw new Error(`Pub/Sub push endpoint update failed: ${err}`);
    }
    // update retry policy on existing subscription
    const updateResponse = await fetch(`https://pubsub.googleapis.com/v1/${subscriptionName}?updateMask=retryPolicy`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            retryPolicy: {
                minimumBackoff: "10s",
                maximumBackoff: "600s",
            },
        }),
    });
    if (!updateResponse.ok) {
        const err = await updateResponse.text();
        throw new Error(`Pub/Sub retry policy update failed: ${err}`);
    }
    // prodn log
    console.info(`pubsub subscription push endpoint updated: tenant=${tenantId}`);
};
export const setupGmailWatch = async (tenantCorsair, tenantId) => {
    await ensureGmailPubSubSubscription(tenantId);
    const keys = tenantCorsair.gmail.keys;
    const accessToken = await keys.get_access_token();
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            topicName,
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gmail watch setup failed: ${err}`);
    }
    // prodn log
    console.info(`gmail watch active: tenant=${tenantId}`);
};
const deleteGmailPubSubSubscription = async (tenantId) => {
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    const projectId = parseProjectFromTopicName(topicName);
    const subscriptionName = `projects/${projectId}/subscriptions/gmail-watch-${tenantId}`;
    const accessToken = await getPubSubAccessToken();
    const response = await fetch(`https://pubsub.googleapis.com/v1/${subscriptionName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok && response.status !== 404) {
        const err = await response.text();
        throw new Error(`Pub/Sub subscription delete failed: ${err}`);
    }
    // prodn log
    console.info(`pubsub subscription deleted: tenant=${tenantId}`);
};
export const stopGmailWatch = async (tenantCorsair, tenantId) => {
    try {
        const keys = tenantCorsair.gmail.keys;
        const accessToken = await keys.get_access_token();
        const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/stop", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        if (!response.ok) {
            const errorBody = await response.text();
            // prodn log
            console.error(`gmail watch stop failed: tenant=${tenantId}`, errorBody);
        }
    }
    catch (err) {
        // prodn log
        console.error(`gmail watch stop threw: tenant=${tenantId}`, err);
    }
    await deleteGmailPubSubSubscription(tenantId);
};
//# sourceMappingURL=gmail.services.js.map