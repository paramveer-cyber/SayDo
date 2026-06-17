"use client";

import { useState } from "react";
import { gmailApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type CalWorkflowId = "week-prep-briefing" | "conflict-detector";

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

const WORKFLOW_MINIMUM_ROLE: Record<CalWorkflowId, UserRole> = {
  "week-prep-briefing": "bronze_subscriber",
  "conflict-detector": "silver_subscriber",
};

const roleAtLeast = (role: UserRole, minimum: UserRole): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[minimum];

const canAccessWorkflow = (
  role: UserRole,
  workflowId: CalWorkflowId,
): boolean => roleAtLeast(role, WORKFLOW_MINIMUM_ROLE[workflowId]);

const WORKFLOWS: {
  id: CalWorkflowId;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "week-prep-briefing",
    label: "Week prep briefing",
    description:
      "Day-by-day overview with prep suggestions for the next 7 days — sent to your inbox",
    icon: "📅",
  },
  {
    id: "conflict-detector",
    label: "Conflict detector",
    description:
      "Find overlapping events and tight transitions in the week ahead — sent to your inbox",
    icon: "⚡",
  },
];

export default function CalendarWorkflowButtons() {
  const auth = useAuth();
  const userRole: UserRole =
    auth.status === "authenticated" ? (auth.user.role as UserRole) : "user";

  const [runningId, setRunningId] = useState<CalWorkflowId | null>(null);
  const [doneId, setDoneId] = useState<CalWorkflowId | null>(null);
  const [errorId, setErrorId] = useState<CalWorkflowId | null>(null);

  const handleRun = async (id: CalWorkflowId) => {
    setRunningId(id);
    setDoneId(null);
    setErrorId(null);
    try {
      await gmailApi.runWorkflow(id);
      setDoneId(id);
      setTimeout(() => setDoneId(null), 3000);
    } catch {
      setErrorId(id);
      setTimeout(() => setErrorId(null), 3000);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        gap: "0.75rem",
        alignItems: "stretch",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: "0.68rem",
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--fg-dim)",
          alignSelf: "center",
          flexShrink: 0,
          minWidth: 72,
        }}
      >
        AI
      </span>

      {WORKFLOWS.map((workflow) => {
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.625rem 1rem",
              border: `2px solid ${isDone ? "var(--green)" : isError ? "var(--red)" : "var(--border-strong)"}`,
              borderRadius: "var(--radius-md)",
              background: "var(--surface)",
              boxShadow: isDone
                ? "3px 3px 0 var(--green-dim)"
                : isError
                  ? "3px 3px 0 var(--red-dim)"
                  : "3px 3px 0 var(--border)",
              transition: "border-color 0.2s, box-shadow 0.2s",
              flex: "1 1 240px",
              maxWidth: 360,
              opacity: hasAccess ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: "1rem", flexShrink: 0 }}>
              {workflow.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--fg)",
                  letterSpacing: "-0.01em",
                }}
              >
                {workflow.label}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--fg-dim)",
                  lineHeight: 1.4,
                  marginTop: 2,
                }}
              >
                {hasAccess ? workflow.description : `Requires ${requiredRole}`}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.25rem",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => handleRun(workflow.id)}
                disabled={!hasAccess || isRunning || runningId !== null}
                className="nb-btn-primary"
                style={{
                  padding: "0.45rem 0.875rem",
                  fontSize: "0.72rem",
                  opacity: !hasAccess ? 0.4 : 1,
                  cursor: !hasAccess ? "not-allowed" : "pointer",
                }}
              >
                {isRunning ? "…" : "Run"}
              </button>
              {isDone && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--green)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Sent
                </span>
              )}
              {isError && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--red)",
                    fontWeight: 600,
                  }}
                >
                  Failed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
