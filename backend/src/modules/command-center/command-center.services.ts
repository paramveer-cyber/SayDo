import type { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import type {
  CommandCenterDbRow,
  CommandCenterMessageData,
  RawCalendarEvent,
  EmailNeedingAttention,
  MeetingToday,
  ConflictDetected,
  FollowUpDue,
} from "./command-center.types.js";

type TenantCorsair = ReturnType<typeof getTenantCorsair>;

const HIGH_PRIORITY_LABEL_NAME = "Priority/High";
const ATTENTION_CANDIDATE_LIMIT = 50;
const FOLLOWUP_CANDIDATE_LIMIT = 30;
const FOLLOWUP_THREAD_LOOKUP_LIMIT = 20;
const FOLLOWUP_MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000;
const FOLLOWUP_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const getHighPriorityLabelId = async (
  tenantCorsair: TenantCorsair,
): Promise<string | null> => {
  const labels = await tenantCorsair.gmail.db.labels.search({
    data: { name: { contains: HIGH_PRIORITY_LABEL_NAME } },
    limit: 1,
    offset: 0,
  });
  const label = labels[0]?.data as { id?: string } | undefined;
  return label?.id ?? null;
};

export const getEmailsNeedingAttention = async (
  tenantCorsair: TenantCorsair,
  limit: number,
): Promise<EmailNeedingAttention[]> => {
  const highPriorityLabelId = await getHighPriorityLabelId(tenantCorsair);

  const rows = (await tenantCorsair.gmail.db.messages.search({
    data: { labelIds: { contains: "INBOX" } },
    limit: ATTENTION_CANDIDATE_LIMIT,
    offset: 0,
  })) as CommandCenterDbRow<CommandCenterMessageData>[];

  const unreadInboxMessages = rows
    .map((row) => row.data)
    .filter((message) => (message.labelIds ?? []).includes("UNREAD"));

  const sortedByPriorityThenRecency = unreadInboxMessages.sort((a, b) => {
    const aIsHighPriority = highPriorityLabelId
      ? (a.labelIds ?? []).includes(highPriorityLabelId)
      : false;
    const bIsHighPriority = highPriorityLabelId
      ? (b.labelIds ?? []).includes(highPriorityLabelId)
      : false;
    if (aIsHighPriority !== bIsHighPriority) return aIsHighPriority ? -1 : 1;
    return Number(b.internalDate ?? 0) - Number(a.internalDate ?? 0);
  });

  return sortedByPriorityThenRecency.slice(0, limit).map((message) => ({
    messageId: message.id,
    threadId: message.threadId,
    from: message.from ?? "",
    subject: message.subject ?? "(no subject)",
    snippet: message.snippet ?? "",
    internalDate: message.internalDate ?? null,
    isHighPriority: highPriorityLabelId
      ? (message.labelIds ?? []).includes(highPriorityLabelId)
      : false,
  }));
};

export const getMeetingsToday = async (
  tenantCorsair: TenantCorsair,
  dayStartIso: string,
  dayEndIso: string,
): Promise<MeetingToday[]> => {
  const result = await tenantCorsair.googlecalendar.api.events.getMany({
    calendarId: "primary",
    timeMin: dayStartIso,
    timeMax: dayEndIso,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  const events = ((result as { items?: unknown[] })?.items ??
    []) as RawCalendarEvent[];

  return events
    .filter((event) => event.status !== "cancelled")
    .map((event) => ({
      eventId: event.id,
      summary: event.summary ?? "(no title)",
      location: event.location,
      htmlLink: event.htmlLink,
      start: event.start,
      end: event.end,
      attendeeCount: event.attendees?.length ?? 0,
    }));
};

export const detectScheduleConflicts = (
  meetingsToday: MeetingToday[],
): ConflictDetected[] => {
  const timedMeetings = meetingsToday
    .filter((meeting) => meeting.start?.dateTime && meeting.end?.dateTime)
    .map((meeting) => ({
      eventId: meeting.eventId,
      summary: meeting.summary,
      startMs: new Date(meeting.start!.dateTime!).getTime(),
      endMs: new Date(meeting.end!.dateTime!).getTime(),
    }))
    .sort((a, b) => a.startMs - b.startMs);

  const conflicts: ConflictDetected[] = [];

  for (let i = 0; i < timedMeetings.length; i++) {
    for (let j = i + 1; j < timedMeetings.length; j++) {
      const earlierMeeting = timedMeetings[i]!;
      const laterMeeting = timedMeetings[j]!;
      if (laterMeeting.startMs >= earlierMeeting.endMs) break;

      conflicts.push({
        eventAId: earlierMeeting.eventId,
        eventASummary: earlierMeeting.summary,
        eventBId: laterMeeting.eventId,
        eventBSummary: laterMeeting.summary,
        overlapStart: new Date(
          Math.max(earlierMeeting.startMs, laterMeeting.startMs),
        ).toISOString(),
        overlapEnd: new Date(
          Math.min(earlierMeeting.endMs, laterMeeting.endMs),
        ).toISOString(),
      });
    }
  }

  return conflicts;
};

export const getFollowUpsDue = async (
  tenantCorsair: TenantCorsair,
  limit: number,
): Promise<FollowUpDue[]> => {
  const sentRows = (await tenantCorsair.gmail.db.messages.search({
    data: { labelIds: { contains: "SENT" } },
    limit: FOLLOWUP_CANDIDATE_LIMIT,
    offset: 0,
  })) as CommandCenterDbRow<CommandCenterMessageData>[];

  const now = Date.now();

  const candidateSentMessages = sentRows
    .map((row) => row.data)
    .filter((message) => {
      const sentAtMs = Number(message.internalDate);
      if (!Number.isFinite(sentAtMs)) return false;
      const ageMs = now - sentAtMs;
      return ageMs >= FOLLOWUP_MIN_AGE_MS && ageMs <= FOLLOWUP_MAX_AGE_MS;
    })
    .sort(
      (a, b) => Number(a.internalDate ?? 0) - Number(b.internalDate ?? 0),
    );

  const followUpsDue: FollowUpDue[] = [];

  for (const sentMessage of candidateSentMessages) {
    if (!sentMessage.threadId) continue;

    const threadRows = (await tenantCorsair.gmail.db.messages.search({
      data: { threadId: { equals: sentMessage.threadId } },
      limit: FOLLOWUP_THREAD_LOOKUP_LIMIT,
      offset: 0,
    })) as CommandCenterDbRow<CommandCenterMessageData>[];

    const sentAtMs = Number(sentMessage.internalDate);
    const hasReplyAfterSending = threadRows.some((row) => {
      const message = row.data;
      if (!(message.labelIds ?? []).includes("INBOX")) return false;
      const messageDateMs = Number(message.internalDate);
      return Number.isFinite(messageDateMs) && messageDateMs > sentAtMs;
    });

    if (!hasReplyAfterSending) {
      followUpsDue.push({
        messageId: sentMessage.id,
        threadId: sentMessage.threadId,
        to: sentMessage.to ?? "",
        subject: sentMessage.subject ?? "(no subject)",
        snippet: sentMessage.snippet ?? "",
        sentAt: sentMessage.internalDate ?? null,
        daysSinceSent: Math.floor(
          (now - sentAtMs) / (24 * 60 * 60 * 1000),
        ),
      });
    }

    if (followUpsDue.length >= limit) break;
  }

  return followUpsDue;
};
