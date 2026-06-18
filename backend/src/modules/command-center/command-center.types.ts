export interface CommandCenterMessageData {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  from?: string;
  to?: string;
  subject?: string;
}

export interface CommandCenterDbRow<TData> {
  id: string;
  data: TData;
}

export interface RawCalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email?: string; responseStatus?: string }[];
}

export interface EmailNeedingAttention {
  messageId: string;
  threadId: string | undefined;
  from: string;
  subject: string;
  snippet: string;
  internalDate: string | null;
  isHighPriority: boolean;
}

export interface MeetingToday {
  eventId: string;
  summary: string;
  location: string | undefined;
  htmlLink: string | undefined;
  start: { dateTime?: string; date?: string; timeZone?: string } | undefined;
  end: { dateTime?: string; date?: string; timeZone?: string } | undefined;
  attendeeCount: number;
}

export interface ConflictDetected {
  eventAId: string;
  eventASummary: string;
  eventBId: string;
  eventBSummary: string;
  overlapStart: string;
  overlapEnd: string;
}

export interface FollowUpDue {
  messageId: string;
  threadId: string;
  to: string;
  subject: string;
  snippet: string;
  sentAt: string | null;
  daysSinceSent: number;
}

export interface CommandCenterOverview {
  emailsNeedingAttention: EmailNeedingAttention[];
  meetingsToday: MeetingToday[];
  conflictsDetected: ConflictDetected[];
  followUpsDue: FollowUpDue[];
  generatedAt: string;
}
