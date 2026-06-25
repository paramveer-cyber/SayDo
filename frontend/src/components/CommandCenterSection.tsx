"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  commandCenterApi,
  gmailApi,
  type CommandCenterOverview,
  type EmailNeedingAttention,
  type MeetingToday,
  type ConflictDetected,
  type FollowUpDue,
} from "../lib/api";
import {
  ActionBtn,
  ErrorBanner,
  LoadingDots,
  formatDate,
} from "./gmail/GmailUI";

function getTodayBoundsIso(): { timeMin: string; timeMax: string } {
  const now = new Date();
  const dayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  const dayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );
  return { timeMin: dayStart.toISOString(), timeMax: dayEnd.toISOString() };
}

function formatEventTimeRange(meeting: MeetingToday): string {
  const startRaw = meeting.start?.dateTime ?? meeting.start?.date;
  if (!startRaw) return "";
  if (!meeting.start?.dateTime) return "All day";

  const startLabel = new Date(startRaw).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endRaw = meeting.end?.dateTime;
  const endLabel = endRaw
    ? new Date(endRaw).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel;
}

function formatOverlapRange(conflict: ConflictDetected): string {
  const startLabel = new Date(conflict.overlapStart).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endLabel = new Date(conflict.overlapEnd).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startLabel} – ${endLabel}`;
}

interface WidgetCardProps {
  title: string;
  accentColor: string;
  accentColorDim: string;
  count: number;
  emptyLabel: string;
  children: React.ReactNode;
}

function WidgetCard({
  title,
  accentColor,
  accentColorDim,
  count,
  emptyLabel,
  children,
}: WidgetCardProps) {
  const isEmpty = count === 0;
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        minHeight: 260,
        maxHeight: 360,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 4,
              height: 4,
              background: accentColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.62rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--fg)",
            }}
          >
            {title}
          </span>
        </div>
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 800,
            color: accentColor,
            background: accentColorDim,
            padding: "0.15rem 0.55rem",
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }} className="scrollbar-thin">
        {isEmpty ? (
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--fg-dim)",
              textAlign: "center",
              padding: "2.5rem 1rem",
            }}
          >
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ItemRow({
  title,
  subtitle,
  meta,
  highlightColor,
  actions,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  highlightColor?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "0.65rem 1rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: highlightColor ?? "var(--fg)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--fg-dim)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {meta && (
          <div
            style={{
              fontSize: "0.62rem",
              color: "var(--fg-dim)",
              flexShrink: 0,
              paddingTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.55rem" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export default function CommandCenterSection() {
  const router = useRouter();
  const [overview, setOverview] = useState<CommandCenterOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [ignoredFollowUpIds, setIgnoredFollowUpIds] = useState<Set<string>>(
    () =>
      new Set(JSON.parse(localStorage.getItem("ignored-followups") ?? "[]")),
  );

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { timeMin, timeMax } = getTodayBoundsIso();
      const data = await commandCenterApi.getOverview(timeMin, timeMax);
      setOverview(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load Command Center",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const removeEmailFromList = (messageId: string) => {
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            emailsNeedingAttention: prev.emailsNeedingAttention.filter(
              (email) => email.messageId !== messageId,
            ),
          }
        : prev,
    );
  };

  const archiveEmail = async (email: EmailNeedingAttention) => {
    setPendingActionId(email.messageId);
    try {
      await gmailApi.modifyMessage(email.messageId, {
        removeLabelIds: ["INBOX"],
      });
      removeEmailFromList(email.messageId);
    } catch {
      setError("Couldn't archive that email, try again.");
    } finally {
      setPendingActionId(null);
    }
  };

  const markEmailRead = async (email: EmailNeedingAttention) => {
    setPendingActionId(email.messageId);
    try {
      await gmailApi.modifyMessage(email.messageId, {
        removeLabelIds: ["UNREAD"],
      });
      removeEmailFromList(email.messageId);
    } catch {
      setError("Couldn't mark that email as read, try again.");
    } finally {
      setPendingActionId(null);
    }
  };

  const sendFollowUpNudge = async (followUp: FollowUpDue) => {
    setPendingActionId(followUp.messageId);
    try {
      const nudgeSubject = followUp.subject.toLowerCase().startsWith("re:")
        ? followUp.subject
        : `Re: ${followUp.subject}`;
      await gmailApi.sendMessage({
        to: followUp.to,
        subject: nudgeSubject,
        body: "Just following up on this — let me know if you have any updates!",
        threadId: followUp.threadId,
      });
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              followUpsDue: prev.followUpsDue.filter(
                (item) => item.messageId !== followUp.messageId,
              ),
            }
          : prev,
      );
    } catch {
      setError("Couldn't send that nudge, try again.");
    } finally {
      setPendingActionId(null);
    }
  };

  const ignoreFollowUp = (messageId: string) => {
    setIgnoredFollowUpIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      localStorage.setItem("ignored-followups", JSON.stringify([...next]));
      return next;
    });
  };

  const emailsNeedingAttention = overview?.emailsNeedingAttention ?? [];
  const meetingsToday = overview?.meetingsToday ?? [];
  const conflictsDetected = overview?.conflictsDetected ?? [];
  const followUpsDue = (overview?.followUpsDue ?? []).filter(
    (f) => !ignoredFollowUpIds.has(f.messageId),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
          height: 52,
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 4,
              height: 4,
              background: "var(--green)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--fg)",
            }}
          >
            Command Center
          </span>
        </div>

        <button
          onClick={loadOverview}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.75rem",
            border: "1px solid var(--border-strong)",
            background: "transparent",
            color: "var(--fg-dim)",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "inherit",
            cursor: loading ? "default" : "pointer",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path
              d="M13.65 4.35A6 6 0 1 0 14 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M13.65 1v3.5h-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Refresh
        </button>
      </header>

      <main
        style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem" }}
        className="scrollbar-thin"
      >
        {loading && !overview ? (
          <LoadingDots />
        ) : (
          <>
            {error && (
              <div style={{ marginBottom: "1.25rem" }}>
                <ErrorBanner message={error} />
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--fg-dim)",
                  letterSpacing: "-0.01em",
                }}
              >
                <span style={{ color: "var(--fg)", fontWeight: 700 }}>
                  {emailsNeedingAttention.length} email
                  {emailsNeedingAttention.length === 1 ? "" : "s"}
                </span>{" "}
                needing attention,{" "}
                <span style={{ color: "var(--fg)", fontWeight: 700 }}>
                  {meetingsToday.length} meeting
                  {meetingsToday.length === 1 ? "" : "s"}
                </span>{" "}
                today,{" "}
                <span style={{ color: "var(--fg)", fontWeight: 700 }}>
                  {conflictsDetected.length} conflict
                  {conflictsDetected.length === 1 ? "" : "s"}
                </span>{" "}
                detected, and{" "}
                <span style={{ color: "var(--fg)", fontWeight: 700 }}>
                  {followUpsDue.length} follow-up
                  {followUpsDue.length === 1 ? "" : "s"}
                </span>{" "}
                due.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "1rem",
              }}
            >
              <WidgetCard
                title="Needs Attention"
                accentColor="var(--red)"
                accentColorDim="var(--red-dim)"
                count={emailsNeedingAttention.length}
                emptyLabel="Inbox is clear. Nothing urgent waiting."
              >
                {emailsNeedingAttention.map((email) => (
                  <ItemRow
                    key={email.messageId}
                    title={email.from || "Unknown sender"}
                    subtitle={email.subject}
                    meta={
                      email.internalDate
                        ? formatDate(email.internalDate)
                        : undefined
                    }
                    highlightColor={
                      email.isHighPriority ? "var(--red)" : undefined
                    }
                    actions={
                      <>
                        <ActionBtn
                          small
                          label="Open"
                          onClick={() =>
                            router.push(
                              `/dashboard/gmail/message/${email.messageId}`,
                            )
                          }
                        />
                        <ActionBtn
                          small
                          label="Mark read"
                          onClick={() => markEmailRead(email)}
                        />
                        <ActionBtn
                          small
                          label="Archive"
                          onClick={() => archiveEmail(email)}
                        />
                      </>
                    }
                  />
                ))}
              </WidgetCard>

              <WidgetCard
                title="Today's Meetings"
                accentColor="var(--blue)"
                accentColorDim="var(--blue-dim)"
                count={meetingsToday.length}
                emptyLabel="Nothing on the calendar today."
              >
                {meetingsToday.map((meeting) => (
                  <ItemRow
                    key={meeting.eventId}
                    title={meeting.summary}
                    subtitle={meeting.location}
                    meta={formatEventTimeRange(meeting)}
                    actions={
                      <>
                        {meeting.htmlLink && (
                          <ActionBtn
                            small
                            label="Open invite"
                            onClick={() =>
                              window.open(meeting.htmlLink, "_blank")
                            }
                          />
                        )}
                        <ActionBtn
                          small
                          label="View calendar"
                          onClick={() => router.push("/dashboard/calendar")}
                        />
                      </>
                    }
                  />
                ))}
              </WidgetCard>

              <WidgetCard
                title="Conflicts Detected"
                accentColor="var(--yellow)"
                accentColorDim="var(--yellow-dim)"
                count={conflictsDetected.length}
                emptyLabel="No overlapping meetings today."
              >
                {conflictsDetected.map((conflict, index) => (
                  <ItemRow
                    key={`${conflict.eventAId}-${conflict.eventBId}-${index}`}
                    title={`${conflict.eventASummary} ↔ ${conflict.eventBSummary}`}
                    subtitle="These meetings overlap"
                    meta={formatOverlapRange(conflict)}
                    highlightColor="var(--yellow)"
                    actions={
                      <ActionBtn
                        small
                        label="Resolve in calendar"
                        onClick={() => router.push("/dashboard/calendar")}
                      />
                    }
                  />
                ))}
              </WidgetCard>

              <WidgetCard
                title="Follow-ups Due"
                accentColor="var(--green)"
                accentColorDim="var(--green-dim)"
                count={followUpsDue.length}
                emptyLabel="No sent emails are waiting on a reply."
              >
                {followUpsDue.map((followUp) => (
                  <ItemRow
                    key={followUp.messageId}
                    title={followUp.to || "Unknown recipient"}
                    subtitle={followUp.subject}
                    meta={`${followUp.daysSinceSent}d ago`}
                    actions={
                      <>
                        <ActionBtn
                          small
                          label="Open thread"
                          onClick={() =>
                            router.push(
                              `/dashboard/gmail/message/${followUp.messageId}`,
                            )
                          }
                        />
                        <ActionBtn
                          small
                          label={
                            pendingActionId === followUp.messageId
                              ? "Sending…"
                              : "Send nudge"
                          }
                          onClick={() => sendFollowUpNudge(followUp)}
                        />
                        <ActionBtn
                          small
                          label="Ignore"
                          onClick={() => ignoreFollowUp(followUp.messageId)}
                        />
                      </>
                    }
                  />
                ))}
              </WidgetCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
