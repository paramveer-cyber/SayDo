"use client";

import { useState } from "react";
import { gmailApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

type WorkflowId =
  | "weekly-digest"
  | "daily-digest"
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

const WORKFLOW_MINIMUM_ROLE: Record<WorkflowId, UserRole> = {
  "weekly-digest": "bronze_subscriber",
  "daily-digest": "silver_subscriber",
  "unsubscribe-suggestions": "silver_subscriber",
  "followup-scan": "silver_subscriber",
};

const canAccessWorkflow = (role: UserRole, workflowId: WorkflowId): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[WORKFLOW_MINIMUM_ROLE[workflowId]];

const WORKFLOWS: { id: WorkflowId; label: string; description: string }[] = [
  {
    id: "daily-digest",
    label: "Daily digest",
    description: "Summarize today's inbox and what needs a reply",
  },
  {
    id: "weekly-digest",
    label: "Weekly digest",
    description:
      "Recap the last 7 days of email, A concise overview of your week",
  },
  {
    id: "unsubscribe-suggestions",
    label: "Find unsubscribe links",
    description: "Spot newsletters and promos worth unsubscribing from",
  },
  {
    id: "followup-scan",
    label: "Follow-up reminders",
    description:
      "Scan sent mail for threads that need a nudge, And sometimes that's all you need",
  },
];

export default function WorkflowButtons() {
  const auth = useAuth();
  const userRole: UserRole =
    auth.status === "authenticated" ? (auth.user.role as UserRole) : "user";

  const [runningId, setRunningId] = useState<WorkflowId | null>(null);
  const [message, setMessage] = useState<{
    id: WorkflowId;
    text: string;
    isError: boolean;
  } | null>(null);

  const handleRun = async (id: WorkflowId) => {
    setRunningId(id);
    setMessage(null);
    try {
      await gmailApi.runWorkflow(id);
      setMessage({
        id,
        text: "Triggered — check your inbox in a bit.",
        isError: false,
      });
    } catch (err) {
      setMessage({
        id,
        text: err instanceof Error ? err.message : "Failed to trigger workflow",
        isError: true,
      });
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h3
        style={{
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--fg-dim)",
        }}
      >
        Workflows
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        {WORKFLOWS.map((workflow) => {
          const hasAccess = canAccessWorkflow(userRole, workflow.id);
          const requiredRole = WORKFLOW_MINIMUM_ROLE[workflow.id].replace(
            /_/g,
            " ",
          );

          return (
            <div
              key={workflow.id}
              className="nb-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                padding: "0.85rem 1rem",
                minWidth: 220,
                flex: "1 1 220px",
                opacity: hasAccess ? 1 : 0.55,
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {workflow.label}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--fg-dim)",
                  lineHeight: 1.4,
                }}
              >
                {hasAccess ? workflow.description : `Requires ${requiredRole}`}
              </div>
              <button
                onClick={() => handleRun(workflow.id)}
                disabled={!hasAccess || runningId === workflow.id}
                className="nb-btn-primary"
                style={{
                  alignSelf: "flex-start",
                  marginTop: "0.25rem",
                  opacity: !hasAccess ? 0.4 : 1,
                  cursor: !hasAccess ? "not-allowed" : "pointer",
                }}
              >
                {runningId === workflow.id ? "Triggering…" : "Run"}
              </button>
              {message?.id === workflow.id && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: message.isError
                      ? "var(--error)"
                      : "var(--accent-text)",
                  }}
                >
                  {message.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
