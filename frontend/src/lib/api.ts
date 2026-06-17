import { tokenStore } from "./tokenStore";
import type { KeybindsMap } from "./keybinds";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type ApiResponse<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(tokenStore.get()
        ? { Authorization: `Bearer ${tokenStore.get()}` }
        : {}),
      ...options.headers,
    },
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.message);
  return (json as { success: true; data: T }).data;
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(tokenStore.get()
        ? { Authorization: `Bearer ${tokenStore.get()}` }
        : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  provider: "local" | "google";
  createdAt: string;
  role:
    | "user"
    | "bronze_subscriber"
    | "silver_subscriber"
    | "gold_subscriber"
    | "admin";
  plugins: Record<string, boolean>;
};

export type AuthPayload = { token: string; user: User };

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    request<AuthPayload>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<AuthPayload>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  google: (idToken: string) =>
    request<AuthPayload>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),

  me: () => request<{ user: User }>("/auth/me"),

  refresh: () =>
    request<{ token: string; user: User }>("/auth/refresh", { method: "POST" }),

  logout: () => request<null>("/auth/logout", { method: "POST" }),

  connectLink: (pluginId: string) =>
    request<{ url: string }>(
      `/auth/connect-link?pluginId=${encodeURIComponent(pluginId)}`,
    ),

  disconnectPlugin: (pluginId: "gmail" | "googlecalendar") =>
    rawRequest<void>(`/auth/plugins/${pluginId}`, { method: "DELETE" }),

  deleteAccount: () => rawRequest<void>("/auth/account", { method: "DELETE" }),
};

export interface UserSettings {
  id: string;
  userId: string;
  geminiApiKey: string | null;
  preferredModel: string;
  useLocalModel: boolean;
  approvalsRequired: boolean;
  promptsAsked: number;
  systemPromptOverride: string | null;
  keybinds: KeybindsMap;
  createdAt: string;
  updatedAt: string;
}

export type UpdateSettingsBody = Partial<{
  geminiApiKey: string | null;
  preferredModel: string;
  useLocalModel: boolean;
  approvalsRequired: boolean;
  systemPromptOverride: string | null;
  keybinds: KeybindsMap;
}>;

export const settingsApi = {
  get: () => request<{ settings: UserSettings }>("/settings"),

  update: (body: UpdateSettingsBody) =>
    request<{ settings: UserSettings }>("/settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const aiApi = {
  prompt: async (body: {
    prompt: string;
    useLocalModal: boolean;
    mcpServer?: string;
    options?: {
      history?: string[];
    };
  }): Promise<string> => {
    const res = await fetch(`${BASE}/ai/prompt`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(tokenStore.get()
          ? { Authorization: `Bearer ${tokenStore.get()}` }
          : {}),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message ?? "Request failed");
    return json.message as string;
  },
};

export interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: { name: string; value: string }[];
  body: { size: number; data?: string };
  parts?: GmailMessagePart[];
}

export interface GmailMessageData {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate?: string;
  sizeEstimate?: number;
  from: string;
  to: string;
  subject: string;
  date?: string;
  body: string;
  createdAt?: string;
  payload?: {
    mimeType: string;
    headers: { name: string; value: string }[];
    body: { size: number; data?: string };
    parts?: GmailMessagePart[];
  };
}

export interface GmailMessage {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  entity_id: string;
  entity_type: "messages";
  version: string;
  data: GmailMessageData;
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
  message: GmailDraftMessageData;
}

export interface GmailDraft {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  entity_id: string;
  entity_type: "drafts";
  version: string;
  data: GmailDraftData;
}

export interface GmailLabelData {
  id: string;
  name: string;
  type: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  messagesTotal?: number;
  messagesUnread?: number;
  color?: { textColor: string; backgroundColor: string };
}

export interface GmailLabel {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  entity_id: string;
  entity_type: "labels";
  version: string;
  data: GmailLabelData;
}

export const gmailApi = {
  listMessages: (params: {
    q?: string;
    labelIds?: string;
    maxResults?: number;
    pageToken?: string;
    pageOffset?: number;
    from?: string;
    to?: string;
    subject?: string;
    threadId?: string;
    includeSpamTrash?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set("q", params.q);
    if (params.labelIds) searchParams.set("labelIds", params.labelIds);
    if (params.maxResults)
      searchParams.set("maxResults", String(params.maxResults));
    if (params.pageToken) searchParams.set("pageToken", params.pageToken);
    if (params.pageOffset !== undefined)
      searchParams.set("pageOffset", String(params.pageOffset));
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.subject) searchParams.set("subject", params.subject);
    if (params.threadId) searchParams.set("threadId", params.threadId);
    if (params.includeSpamTrash !== undefined)
      searchParams.set("includeSpamTrash", String(params.includeSpamTrash));
    return rawRequest<GmailMessage[]>(`/gmail/messages?${searchParams}`);
  },

  getMessage: (
    id: string,
    params?: { format?: "full" | "minimal" | "raw" | "metadata" },
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.format) searchParams.set("format", params.format);
    const qs = searchParams.toString();
    return rawRequest<GmailMessage | null>(
      `/gmail/messages/${id}${qs ? `?${qs}` : ""}`,
    );
  },

  modifyMessage: (
    id: string,
    body: { addLabelIds?: string[]; removeLabelIds?: string[] },
  ) =>
    rawRequest<GmailMessage>(`/gmail/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  trashMessage: (id: string) =>
    rawRequest<GmailMessage>(`/gmail/messages/${id}/trash`, {
      method: "POST",
    }),

  untrashMessage: (id: string) =>
    rawRequest<GmailMessage>(`/gmail/messages/${id}/untrash`, {
      method: "POST",
    }),

  deleteMessage: (id: string) =>
    rawRequest<void>(`/gmail/messages/${id}`, { method: "DELETE" }),

  batchModify: (body: {
    ids: string[];
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }) =>
    rawRequest<void>("/gmail/messages/batch-modify", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  sendMessage: (body: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    threadId?: string;
  }) =>
    rawRequest<GmailMessage>("/gmail/messages/send", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listDrafts: () => rawRequest<GmailDraft[]>("/gmail/drafts"),

  createDraft: (body: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }) =>
    rawRequest<GmailDraft>("/gmail/drafts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteDraft: (id: string) =>
    rawRequest<void>(`/gmail/drafts/${id}`, { method: "DELETE" }),

  updateDraft: (
    id: string,
    body: { to: string; subject: string; body: string; threadId?: string },
  ) =>
    rawRequest<GmailDraft>(`/gmail/drafts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  sendDraft: (id: string) =>
    rawRequest<GmailMessage>(`/gmail/drafts/${id}/send`, {
      method: "POST",
    }),

  listLabels: () => rawRequest<GmailLabel[]>("/gmail/labels"),
  syncDB: (params?: {
    labelIds?: string;
    q?: string;
    maxResults?: number;
    maxPages?: number;
    fetchFull?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.labelIds) searchParams.set("labelIds", params.labelIds);
    if (params?.q) searchParams.set("q", params.q);
    if (params?.maxResults !== undefined)
      searchParams.set("maxResults", String(params.maxResults));
    if (params?.maxPages !== undefined)
      searchParams.set("maxPages", String(params.maxPages));
    if (params?.fetchFull !== undefined)
      searchParams.set("fetchFull", String(params.fetchFull));
    const qs = searchParams.toString();
    return rawRequest<{
      totalMessages: number;
      syncedInFull: number;
      pagesFetched: number;
    }>(`/gmail/messages/sync${qs ? `?${qs}` : ""}`, {
      method: "POST",
    });
  },

  createLabel: (body: {
    name: string;
    messageListVisibility?: string;
    labelListVisibility?: string;
  }) =>
    rawRequest<GmailLabel>("/gmail/labels", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteLabel: (id: string) =>
    rawRequest<void>(`/gmail/labels/${id}`, { method: "DELETE" }),

  runWorkflow: (
    workflowId:
      | "weekly-digest"
      | "daily-digest"
      | "unsubscribe-suggestions"
      | "followup-scan"
      | "week-prep-briefing"
      | "conflict-detector",
  ) =>
    request<null>(`/gmail/workflows/${workflowId}/run`, {
      method: "POST",
    }),
};

export interface CalEvent {
  id: string;
  status?: "confirmed" | "tentative" | "cancelled";
  htmlLink?: string;
  created?: string;
  updated?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  creator?: { email: string; self?: boolean };
  organizer?: { email: string; self?: boolean };
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: {
    email?: string;
    displayName?: string;
    responseStatus?: string;
    self?: boolean;
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  recurrence?: string[];
  iCalUID?: string;
  sequence?: number;
  eventType?: string;
}

export interface CalEventsListResponse {
  kind?: string;
  summary?: string;
  timeZone?: string;
  items: CalEvent[];
  nextPageToken?: string;
}

export interface AvailabilityResponse {
  calendars: Record<string, { busy: { start: string; end: string }[] }>;
}

export const calendarApi = {
  listEvents: (params: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    timeZone?: string;
    singleEvents?: boolean;
    orderBy?: string;
    maxResults?: number;
    q?: string;
    pageToken?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.calendarId) searchParams.set("calendarId", params.calendarId);
    if (params.timeMin) searchParams.set("timeMin", params.timeMin);
    if (params.timeMax) searchParams.set("timeMax", params.timeMax);
    if (params.timeZone) searchParams.set("timeZone", params.timeZone);
    if (params.singleEvents !== undefined)
      searchParams.set("singleEvents", String(params.singleEvents));
    if (params.orderBy) searchParams.set("orderBy", params.orderBy);
    if (params.maxResults)
      searchParams.set("maxResults", String(params.maxResults));
    if (params.q) searchParams.set("q", params.q);
    if (params.pageToken) searchParams.set("pageToken", params.pageToken);
    return rawRequest<CalEventsListResponse>(
      `/calendar/events?${searchParams}`,
    );
  },

  getEvent: (eventId: string, calendarId?: string) => {
    const searchParams = new URLSearchParams();
    if (calendarId) searchParams.set("calendarId", calendarId);
    const qs = searchParams.toString();
    return rawRequest<CalEvent>(
      `/calendar/events/${eventId}${qs ? `?${qs}` : ""}`,
    );
  },

  createEvent: (body: {
    calendarId?: string;
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime?: string; date?: string; timeZone?: string };
    end?: { dateTime?: string; date?: string; timeZone?: string };
    attendees?: { email: string }[];
    colorId?: string;
    recurrence?: string[];
    sendUpdates?: "all" | "externalOnly" | "none";
  }) =>
    rawRequest<CalEvent>("/calendar/events", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateEvent: (
    eventId: string,
    body: {
      calendarId?: string;
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime?: string; date?: string; timeZone?: string };
      end?: { dateTime?: string; date?: string; timeZone?: string };
      attendees?: { email: string }[];
      sendUpdates?: "all" | "externalOnly" | "none";
    },
  ) =>
    rawRequest<CalEvent>(`/calendar/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteEvent: (eventId: string, calendarId?: string, sendUpdates?: string) => {
    const searchParams = new URLSearchParams();
    if (calendarId) searchParams.set("calendarId", calendarId);
    if (sendUpdates) searchParams.set("sendUpdates", sendUpdates);
    const qs = searchParams.toString();
    return rawRequest<void>(
      `/calendar/events/${eventId}${qs ? `?${qs}` : ""}`,
      {
        method: "DELETE",
      },
    );
  },

  checkAvailability: (body: {
    timeMin: string;
    timeMax: string;
    timeZone?: string;
    calendarIds: string[];
  }) =>
    rawRequest<AvailabilityResponse>("/calendar/availability", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export type RazorpayOrderData = {
  order_id: string;
  amount: number;
  currency: string;
};

export type RazorpayVerifyData = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  new_role: string;
};

export const paymentApi = {
  createOrder: (amountInPaise: number, currency = "INR", receipt?: string) =>
    request<RazorpayOrderData>("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amountInPaise, currency, receipt }),
    }),

  verifyPayment: (body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    target_role: string;
  }) =>
    request<RazorpayVerifyData>("/api/payments/verify-payment", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
