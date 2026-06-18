import type { users } from "../../db/schema.js";

export type UserRole = (typeof users.$inferSelect)["role"];

const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  bronze_subscriber: 1,
  silver_subscriber: 2,
  gold_subscriber: 3,
  admin: 99,
};

export const roleAtLeast = (role: UserRole, minimum: UserRole): boolean =>
  ROLE_RANK[role] >= ROLE_RANK[minimum];

export const PROMPT_LIMITS: Record<UserRole, number> = {
  user: 5,
  bronze_subscriber: 50,
  silver_subscriber: 200,
  gold_subscriber: 1000,
  admin: Infinity,
};

export type WorkflowId =
  | "email-priority"
  | "weekly-digest"
  | "daily-digest"
  | "unsubscribe-suggestions"
  | "followup-scan"
  | "bulk-cleanup"
  | "week-prep-briefing"
  | "conflict-detection"
  | "bulk-prioritize-week";

const WORKFLOW_MINIMUM_ROLE: Record<WorkflowId, UserRole> = {
  "email-priority": "user",
  "weekly-digest": "bronze_subscriber",
  "daily-digest": "silver_subscriber",
  "unsubscribe-suggestions": "silver_subscriber",
  "followup-scan": "silver_subscriber",
  "bulk-cleanup": "gold_subscriber",
  "week-prep-briefing": "bronze_subscriber",
  "conflict-detection": "silver_subscriber",
  "bulk-prioritize-week": "bronze_subscriber",
};

export const canAccessWorkflow = (
  role: UserRole,
  workflowId: WorkflowId,
): boolean => roleAtLeast(role, WORKFLOW_MINIMUM_ROLE[workflowId]);

export const assertWorkflowAccess = (
  role: UserRole,
  workflowId: WorkflowId,
): void => {
  if (!canAccessWorkflow(role, workflowId)) {
    throw new Error(
      `Role '${role}' does not have access to workflow '${workflowId}'`,
    );
  }
};

export const isPromptLimitExceeded = (
  role: UserRole,
  promptsAsked: number,
  hasOwnApiKey: boolean,
): boolean => {
  if (hasOwnApiKey) return false;
  return promptsAsked >= PROMPT_LIMITS[role];
};
