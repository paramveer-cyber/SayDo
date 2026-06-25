import { z } from "zod";
import { ApiError } from "../../common/utils/api-error.js";
import type { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import { getPubSubAccessToken } from "../../common/config/pubsub.client.js";
import type {
  SendMessageBody,
  ModifyMessageBody,
  BatchModifyMessagesBody,
  ModifyThreadBody,
  CreateDraftBody,
  UpdateDraftBody,
  CreateLabelBody,
  UpdateLabelBody,
} from "./gmail.modals.js";
import type {
  CorsairDbRow,
  GmailMessageData,
  GmailThreadData,
  GmailDraftData,
  GmailLabelData,
  RawGmailDraftApiResponse,
  NormalizedDraft,
  CorsairDbMessageFilter,
  CorsairDbThreadFilter,
  CorsairDbDraftFilter,
  ListMessagesServiceQuery,
  ListThreadsServiceQuery,
  ListDraftsServiceQuery,
  SyncMessagesQuery,
  SyncMessagesResult,
} from "./gmail.types.js";

type TenantCorsair = ReturnType<typeof getTenantCorsair>;

const HEADER_CONTROL_CHARS = /[\x00-\x1f\x7f\u2028\u2029]/g;

const sanitizeHeaderValue = (value: string): string =>
  value.replace(HEADER_CONTROL_CHARS, "").trim();

const emailAddressSchema = z.email();

const sanitizeEmailAddress = (value: string): string => {
  const sanitized = sanitizeHeaderValue(value);
  const firstAddress = sanitized.split(/\s*,\s*/)[0] ?? "";
  const parsedAddress = emailAddressSchema.safeParse(firstAddress);

  if (!parsedAddress.success) {
    throw ApiError.badRequest(`Invalid email address: ${firstAddress}`);
  }

  return parsedAddress.data;
};

const sanitizeSubject = (value: string): string => {
  const sanitized = sanitizeHeaderValue(value);
  return sanitized.slice(0, 988);
};

export const buildRawEmailBase64 = (fields: {
  to: string;
  subject: string;
  body: string;
  threadId?: string | undefined;
  cc?: string | undefined;
  bcc?: string | undefined;
}) => {
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

const normalizeLabelIds = (val: unknown): string[] | undefined => {
  if (!val) return undefined;
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") return val.split(",").filter(Boolean);
  return undefined;
};

const toNumber = (val: unknown, fallback: number) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

export const listMessages = async (
  tenantCorsair: TenantCorsair,
  query: ListMessagesServiceQuery,
) => {
  const limit = toNumber(query.maxResults, 20);
  const offset = toNumber(query.pageOffset, 0);

  const filters: CorsairDbMessageFilter = {};

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

  return rows as CorsairDbRow<GmailMessageData>[];
};

export const getMessage = (tenantCorsair: TenantCorsair, messageId: string) =>
  tenantCorsair.gmail.db.messages
    .search({
      data: { id: { equals: messageId } },
      limit: 1,
      offset: 0,
    })
    .then((rows: CorsairDbRow<GmailMessageData>[]) => rows[0] ?? null);

export const sendMessage = (
  tenantCorsair: TenantCorsair,
  fields: SendMessageBody,
) =>
  tenantCorsair.gmail.api.messages.send({
    raw: buildRawEmailBase64(fields),
    ...(fields.threadId !== undefined && { threadId: fields.threadId }),
  });

export const deleteMessage = (
  tenantCorsair: TenantCorsair,
  messageId: string,
) => tenantCorsair.gmail.api.messages.delete({ id: messageId });

export const trashMessage = (tenantCorsair: TenantCorsair, messageId: string) =>
  tenantCorsair.gmail.api.messages.trash({ id: messageId });

export const untrashMessage = (
  tenantCorsair: TenantCorsair,
  messageId: string,
) => tenantCorsair.gmail.api.messages.untrash({ id: messageId });

export const modifyMessage = (
  tenantCorsair: TenantCorsair,
  messageId: string,
  fields: ModifyMessageBody,
) =>
  tenantCorsair.gmail.api.messages.modify({
    id: messageId,
    ...(fields.addLabelIds !== undefined && {
      addLabelIds: fields.addLabelIds,
    }),
    ...(fields.removeLabelIds !== undefined && {
      removeLabelIds: fields.removeLabelIds,
    }),
  });

export const batchModifyMessages = async (
  tenantCorsair: TenantCorsair,
  fields: BatchModifyMessagesBody,
) => {
  await tenantCorsair.gmail.api.messages.batchModify({
    ids: fields.ids,
    ...(fields.addLabelIds !== undefined && {
      addLabelIds: fields.addLabelIds,
    }),
    ...(fields.removeLabelIds !== undefined && {
      removeLabelIds: fields.removeLabelIds,
    }),
  });

  await Promise.all(
    fields.ids.map((messageId) =>
      tenantCorsair.gmail.api.messages.get({ id: messageId }).catch(() => {}),
    ),
  );
};

export const listThreads = async (
  tenantCorsair: TenantCorsair,
  query: ListThreadsServiceQuery,
) => {
  const limit = toNumber(query.maxResults, 100);
  const offset = toNumber(query.pageOffset, 0);

  const filters: CorsairDbThreadFilter = {};

  if (query.q !== undefined) {
    filters.snippet = { contains: String(query.q) };
  }

  const rows = await tenantCorsair.gmail.db.threads.search({
    data: filters,
    limit,
    offset,
  });

  return rows as CorsairDbRow<GmailThreadData>[];
};

export const getThread = (tenantCorsair: TenantCorsair, threadId: string) =>
  tenantCorsair.gmail.db.threads
    .search({
      data: { id: { equals: threadId } },
      limit: 1,
      offset: 0,
    })
    .then((rows: CorsairDbRow<GmailThreadData>[]) => rows[0] ?? null);

export const modifyThread = (
  tenantCorsair: TenantCorsair,
  threadId: string,
  fields: ModifyThreadBody,
) =>
  tenantCorsair.gmail.api.threads.modify({
    id: threadId,
    ...(fields.addLabelIds !== undefined && {
      addLabelIds: fields.addLabelIds,
    }),
    ...(fields.removeLabelIds !== undefined && {
      removeLabelIds: fields.removeLabelIds,
    }),
  });

export const trashThread = (tenantCorsair: TenantCorsair, threadId: string) =>
  tenantCorsair.gmail.api.threads.trash({ id: threadId });

export const untrashThread = (tenantCorsair: TenantCorsair, threadId: string) =>
  tenantCorsair.gmail.api.threads.untrash({ id: threadId });

export const deleteThread = (tenantCorsair: TenantCorsair, threadId: string) =>
  tenantCorsair.gmail.api.threads.delete({ id: threadId });

const extractHeader = (
  headers: { name: string; value: string }[] | undefined,
  name: string,
) =>
  headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
  "";

const normalizeDraft = (raw: RawGmailDraftApiResponse): NormalizedDraft => {
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

export const listDrafts = async (
  tenantCorsair: TenantCorsair,
  query: ListDraftsServiceQuery,
) => {
  const limit = toNumber(query.maxResults, 100);

  const listResult = await tenantCorsair.gmail.api.drafts.list({
    maxResults: limit,
  });

  const draftStubs: { id: string }[] = listResult?.drafts ?? [];

  if (draftStubs.length === 0) return [];

  const rawDrafts = await Promise.allSettled(
    draftStubs.map((stub) =>
      tenantCorsair.gmail.api.drafts.get({ id: stub.id }),
    ),
  );

  return rawDrafts
    .filter(
      (r): r is PromiseFulfilledResult<RawGmailDraftApiResponse> =>
        r.status === "fulfilled",
    )
    .map((r) => normalizeDraft(r.value));
};

export const getDraft = (tenantCorsair: TenantCorsair, draftId: string) =>
  tenantCorsair.gmail.db.drafts
    .search({
      data: { id: { equals: draftId } },
      limit: 1,
      offset: 0,
    })
    .then((rows: CorsairDbRow<GmailDraftData>[]) => rows[0] ?? null);

export const createDraft = (
  tenantCorsair: TenantCorsair,
  fields: CreateDraftBody,
) =>
  tenantCorsair.gmail.api.drafts.create({
    draft: {
      message: {
        raw: buildRawEmailBase64(fields),
        ...(fields.threadId !== undefined && { threadId: fields.threadId }),
      },
    },
  });

export const updateDraft = (
  tenantCorsair: TenantCorsair,
  draftId: string,
  fields: UpdateDraftBody,
) =>
  tenantCorsair.gmail.api.drafts.update({
    id: draftId,
    draft: {
      message: {
        raw: buildRawEmailBase64(fields),
        ...(fields.threadId !== undefined && { threadId: fields.threadId }),
      },
    },
  });

export const deleteDraft = (tenantCorsair: TenantCorsair, draftId: string) =>
  tenantCorsair.gmail.api.drafts.delete({ id: draftId });

export const sendDraft = (tenantCorsair: TenantCorsair, draftId: string) =>
  tenantCorsair.gmail.api.drafts.send({ id: draftId });

export const listLabels = (tenantCorsair: TenantCorsair) =>
  tenantCorsair.gmail.api.labels.list();

export const getLabel = (tenantCorsair: TenantCorsair, labelId: string) =>
  tenantCorsair.gmail.db.labels
    .search({
      data: { id: { equals: labelId } },
      limit: 1,
      offset: 0,
    })
    .then((rows: CorsairDbRow<GmailLabelData>[]) => rows[0] ?? null);

export const createLabel = (
  tenantCorsair: TenantCorsair,
  fields: CreateLabelBody,
) =>
  tenantCorsair.gmail.api.labels.create({
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

export const deleteLabel = (tenantCorsair: TenantCorsair, labelId: string) =>
  tenantCorsair.gmail.api.labels.delete({ id: labelId });

export const updateLabel = (
  tenantCorsair: TenantCorsair,
  labelId: string,
  fields: UpdateLabelBody,
) =>
  tenantCorsair.gmail.api.labels.update({
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

export const syncAllMessages = async (
  tenantCorsair: TenantCorsair,
  query: SyncMessagesQuery,
): Promise<SyncMessagesResult> => {
  const maxResults = toNumber(query.maxResults, 10);
  const maxPages = toNumber(query.maxPages, 2);
  const fetchFull =
    query.fetchFull === undefined ||
    query.fetchFull === "true" ||
    query.fetchFull === true;
  const labelIds = normalizeLabelIds(query.labelIds);
  const q = query.q !== undefined ? String(query.q) : undefined;

  const messageIds: string[] = [];
  let pageToken: string | undefined;
  let pagesFetched = 0;

  do {
    const listResult = await tenantCorsair.gmail.api.messages.list({
      maxResults,
      ...(q !== undefined && { q }),
      ...(labelIds !== undefined && { labelIds }),
      ...(pageToken !== undefined && { pageToken }),
    });

    for (const message of listResult.messages ?? []) {
      if (message.id) messageIds.push(message.id);
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
    await Promise.all(
      batch.map((id) =>
        tenantCorsair.gmail.api.messages.get({ id, format: "metadata" }),
      ),
    );
    syncedInFull += batch.length;
  }

  // prodn log
  console.log(
    `gmail sync done: total=${messageIds.length} synced=${syncedInFull} pages=${pagesFetched}`,
  );

  return { totalMessages: messageIds.length, syncedInFull, pagesFetched };
};

const parseProjectFromTopicName = (topicName: string): string => {
  const match = topicName.match(/^projects\/([^/]+)\/topics\/[^/]+$/);
  if (!match || !match[1]) {
    throw new Error(
      `GMAIL_PUBSUB_TOPIC must be a full resource name like "projects/{project}/topics/{topic}", got: ${topicName}`,
    );
  }
  return match[1];
};

const ensureGmailPubSubSubscription = async (
  tenantId: string,
): Promise<void> => {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC!;
  const projectId = parseProjectFromTopicName(topicName);
  const pushEndpoint = `${process.env.PUBLISHED_API_URL}/webhooks?tenant=${tenantId}`;
  const subscriptionName = `projects/${projectId}/subscriptions/gmail-watch-${tenantId}`;
  const accessToken = await getPubSubAccessToken();

  const createResponse = await fetch(
    `https://pubsub.googleapis.com/v1/${subscriptionName}`,
    {
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
    },
  );

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

  const modifyResponse = await fetch(
    `https://pubsub.googleapis.com/v1/${subscriptionName}:modifyPushConfig`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pushConfig: { pushEndpoint } }),
    },
  );

  if (!modifyResponse.ok) {
    const err = await modifyResponse.text();
    throw new Error(`Pub/Sub push endpoint update failed: ${err}`);
  }

  // update retry policy on existing subscription
  const updateResponse = await fetch(
    `https://pubsub.googleapis.com/v1/${subscriptionName}?updateMask=retryPolicy`,
    {
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
    },
  );

  if (!updateResponse.ok) {
    const err = await updateResponse.text();
    throw new Error(`Pub/Sub retry policy update failed: ${err}`);
  }

  // prodn log
  console.info(`pubsub subscription push endpoint updated: tenant=${tenantId}`);
};

export const setupGmailWatch = async (
  tenantCorsair: TenantCorsair,
  tenantId: string,
): Promise<void> => {
  await ensureGmailPubSubSubscription(tenantId);

  const keys = tenantCorsair.gmail.keys;
  const accessToken = await keys.get_access_token();
  const topicName = process.env.GMAIL_PUBSUB_TOPIC!;

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/watch",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicName,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gmail watch setup failed: ${err}`);
  }

  // prodn log
  console.info(`gmail watch active: tenant=${tenantId}`);
};

const deleteGmailPubSubSubscription = async (
  tenantId: string,
): Promise<void> => {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC!;
  const projectId = parseProjectFromTopicName(topicName);
  const subscriptionName = `projects/${projectId}/subscriptions/gmail-watch-${tenantId}`;
  const accessToken = await getPubSubAccessToken();

  const response = await fetch(
    `https://pubsub.googleapis.com/v1/${subscriptionName}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok && response.status !== 404) {
    const err = await response.text();
    throw new Error(`Pub/Sub subscription delete failed: ${err}`);
  }

  // prodn log
  console.info(`pubsub subscription deleted: tenant=${tenantId}`);
};

export const stopGmailWatch = async (
  tenantCorsair: TenantCorsair,
  tenantId: string,
): Promise<void> => {
  try {
    const keys = tenantCorsair.gmail.keys;
    const accessToken = await keys.get_access_token();

    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/stop",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      // prodn log
      console.error(`gmail watch stop failed: tenant=${tenantId}`, errorBody);
    }
  } catch (err) {
    // prodn log
    console.error(`gmail watch stop threw: tenant=${tenantId}`, err);
  }

  await deleteGmailPubSubSubscription(tenantId);
};
