"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gmailApi } from "../../../../lib/api";
import { useAuth } from "../../../../context/AuthContext";

type GmailWorkflowId =
  | "bulk-prioritize-week"
  | "daily-digest"
  | "weekly-digest"
  | "unsubscribe-suggestions"
  | "followup-scan";

type UserRole =
  | "user"
  | "bronze_subscriber"
  | "silver_subscriber"
  | "gold_subscriber"
  | "admin";

const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  bronze_subscriber: 1,
  silver_subscriber: 2,
  gold_subscriber: 3,
  admin: 99,
};

const WORKFLOW_MINIMUM_ROLE: Record<GmailWorkflowId, UserRole> = {
  "bulk-prioritize-week": "bronze_subscriber",
  "weekly-digest": "bronze_subscriber",
  "daily-digest": "silver_subscriber",
  "unsubscribe-suggestions": "silver_subscriber",
  "followup-scan": "silver_subscriber",
};

const canAccessWorkflow = (
  role: UserRole,
  workflowId: GmailWorkflowId,
): boolean => ROLE_RANK[role] >= ROLE_RANK[WORKFLOW_MINIMUM_ROLE[workflowId]];

const WORKFLOWS: {
  id: GmailWorkflowId;
  label: string;
  description: string;
  detail: string;
  accentColor: string;
  accentDim: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "bulk-prioritize-week",
    label: "Prioritize last 7 days",
    description:
      "AI-classify every inbox email from the past week and apply High / Medium / Low labels",
    detail:
      "Scans your last 7 days of inbox, skips anything already labelled, and fires an AI classification for each message. Labels are applied directly inside Gmail — visible even without opening SayDo.",
    accentColor: "var(--red)",
    accentDim: "var(--red-dim, rgba(239,68,68,0.08))",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle
          cx="10"
          cy="10"
          r="7.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 6.5V10.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="13" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "daily-digest",
    label: "Daily digest",
    description: "Summarise today's inbox and surface what needs a reply",
    detail:
      "Reads your inbox from the last 24 hours, identifies threads waiting on you, and sends a structured summary straight to your inbox. One email, full picture.",
    accentColor: "var(--blue)",
    accentDim: "var(--blue-dim)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect
          x="2"
          y="4"
          width="16"
          height="12"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M2 7.5L10 12L18 7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "weekly-digest",
    label: "Weekly digest",
    description: "A concise recap of the last 7 days of email",
    detail:
      "Aggregates the past week's inbox into a structured overview — key threads, unresolved items, and what moved forward. Delivered as a single email.",
    accentColor: "var(--green)",
    accentDim: "var(--green-dim)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 15L7 9L11 12L15 6L18 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "unsubscribe-suggestions",
    label: "Find unsubscribe links",
    description: "Spot newsletters and promos worth cutting",
    detail:
      "Scans recent email for recurring senders and marketing content, then compiles a list of unsubscribe links so you can clean your inbox in one pass.",
    accentColor: "var(--yellow)",
    accentDim: "var(--yellow-dim)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle
          cx="10"
          cy="10"
          r="7.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M7 10H13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "followup-scan",
    label: "Follow-up reminders",
    description: "Find sent threads that have gone quiet and need a nudge",
    detail:
      "Looks through your sent mail for conversations where you're still waiting on a reply. Surfaces the ones that have been silent longest so you know exactly who to chase.",
    accentColor: "var(--fg-dim)",
    accentDim: "var(--border)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 3V10L14 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="10"
          cy="10"
          r="7.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
];

export default function GmailWorkflowsPage() {
  const router = useRouter();
  const auth = useAuth();
  const userRole: UserRole =
    auth.status === "authenticated" ? (auth.user.role as UserRole) : "user";

  const [runningId, setRunningId] = useState<GmailWorkflowId | null>(null);
  const [doneId, setDoneId] = useState<GmailWorkflowId | null>(null);
  const [errorId, setErrorId] = useState<GmailWorkflowId | null>(null);

  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    import("gsap").then(({ default: gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(
        headerRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 0.1 },
      );
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        tl.fromTo(
          card,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          i === 0 ? "-=0.25" : "-=0.38",
        );
      });
    });
  }, []);

  const handleRun = async (id: GmailWorkflowId) => {
    if (!canAccessWorkflow(userRole, id)) return;
    setRunningId(id);
    setDoneId(null);
    setErrorId(null);
    try {
      await gmailApi.runWorkflow(id);
      setDoneId(id);
      setTimeout(() => setDoneId(null), 4000);
    } catch {
      setErrorId(id);
      setTimeout(() => setErrorId(null), 4000);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      <div
        ref={headerRef}
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-dim)",
              padding: "0 0.25rem",
              fontSize: "0.9rem",
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <div style={{ width: 4, height: 4, background: "var(--red)" }} />
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.62rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            AI Workflows — Gmail
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.3rem" }}>
          <div style={{ width: 5, height: 5, background: "var(--red)" }} />
          <div style={{ width: 5, height: 5, background: "var(--yellow)" }} />
          <div style={{ width: 5, height: 5, background: "var(--green)" }} />
        </div>
      </div>

      <div
        style={{ flex: 1, overflowY: "auto", padding: "2rem 1.75rem" }}
        className="scrollbar-thin"
      >
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            paddingBottom: "2rem",
            marginBottom: "2rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
          }}
        >
          <div
            style={{
              paddingRight: "2rem",
              borderRight: "1px solid var(--border)",
            }}
          >
            <h1
              style={{
                fontFamily: "'Movement', sans-serif",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                letterSpacing: "-0.03em",
                lineHeight: 0.92,
                margin: "0 0 1rem",
              }}
            >
              Run AI on
              <br />
              <span style={{ color: "var(--red)" }}>your inbox.</span>
            </h1>
          </div>
          <div
            style={{
              paddingLeft: "2rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <p
              style={{
                fontSize: "0.8rem",
                lineHeight: 1.65,
                color: "var(--fg-dim)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Trigger a workflow and get results delivered straight to your
              inbox. Each one reads your real Gmail data and produces something
              you can act on immediately.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: 680,
          }}
        >
          {WORKFLOWS.map((workflow, i) => {
            const isRunning = runningId === workflow.id;
            const isDone = doneId === workflow.id;
            const isError = errorId === workflow.id;
            const hasAccess = canAccessWorkflow(userRole, workflow.id);
            const requiredRole = WORKFLOW_MINIMUM_ROLE[workflow.id].replace(
              /_/g,
              " ",
            );

            return (
              <div
                key={workflow.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isDone ? "var(--green)" : isError ? "var(--red)" : "var(--border-strong)"}`,
                  padding: "1.75rem",
                  position: "relative",
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
                  transition: "border-color 0.25s",
                  overflow: "hidden",
                  opacity: hasAccess ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: isDone
                      ? "var(--green)"
                      : isError
                        ? "var(--red)"
                        : workflow.accentColor,
                    transition: "background 0.25s",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "1.25rem",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      background: workflow.accentDim,
                      border: `1px solid ${workflow.accentColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: workflow.accentColor,
                    }}
                  >
                    {workflow.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.52rem",
                        fontWeight: 800,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: workflow.accentColor,
                        marginBottom: "0.4rem",
                      }}
                    >
                      Workflow
                    </div>
                    <div
                      style={{
                        fontFamily: "'Movement', sans-serif",
                        fontSize: "1.5rem",
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                        marginBottom: "0.6rem",
                      }}
                    >
                      {workflow.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--fg-dim)",
                        lineHeight: 1.6,
                        marginBottom: "0.75rem",
                      }}
                    >
                      {hasAccess
                        ? workflow.description
                        : `Requires ${requiredRole} — upgrade to unlock`}
                    </div>
                    {hasAccess && (
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--fg-dim)",
                          lineHeight: 1.65,
                          borderLeft: `2px solid ${workflow.accentColor}`,
                          paddingLeft: "0.75rem",
                          opacity: 0.8,
                        }}
                      >
                        {workflow.detail}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginTop: "1.5rem",
                    paddingTop: "1.25rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <button
                    onClick={() => handleRun(workflow.id)}
                    disabled={!hasAccess || isRunning || runningId !== null}
                    style={{
                      padding: "0.55rem 1.5rem",
                      border: "none",
                      background:
                        !hasAccess || isRunning || runningId !== null
                          ? "var(--border)"
                          : "var(--fg)",
                      color:
                        !hasAccess || isRunning || runningId !== null
                          ? "var(--fg-dim)"
                          : "var(--bg)",
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor:
                        !hasAccess || isRunning || runningId !== null
                          ? "not-allowed"
                          : "pointer",
                      fontFamily: "inherit",
                      clipPath:
                        "polygon(0 0, 100% 0, 100% 100%, 7px 100%, 0 calc(100% - 7px))",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (hasAccess && !isRunning && runningId === null)
                        e.currentTarget.style.opacity = "0.85";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    {isRunning ? "Running…" : "Run workflow"}
                  </button>

                  {isDone && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          background: "var(--green)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--green)",
                        }}
                      >
                        On its way — check your inbox
                      </span>
                    </div>
                  )}
                  {isError && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          background: "var(--red)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--red)",
                        }}
                      >
                        Failed — try again
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: "2.5rem",
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
          }}
        >
          {[
            { label: "Inbox delivery", color: "var(--blue)" },
            { label: "Real Gmail data", color: "var(--red)" },
            { label: "Actionable output", color: "var(--green)" },
          ].map((item, i) => (
            <div
              key={item.label}
              style={{
                padding: "0.875rem 1rem",
                borderRight: i < 2 ? "1px solid var(--border)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  background: item.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--fg-dim)",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
