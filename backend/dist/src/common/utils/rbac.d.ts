import type { users } from "../../db/schema.js";
export type UserRole = (typeof users.$inferSelect)["role"];
export declare const roleAtLeast: (role: UserRole, minimum: UserRole) => boolean;
export declare const PROMPT_LIMITS: Record<UserRole, number>;
export type WorkflowId = "email-priority" | "weekly-digest" | "daily-digest" | "unsubscribe-suggestions" | "followup-scan" | "bulk-cleanup" | "week-prep-briefing" | "conflict-detection" | "bulk-prioritize-week";
export declare const canAccessWorkflow: (role: UserRole, workflowId: WorkflowId) => boolean;
export declare const assertWorkflowAccess: (role: UserRole, workflowId: WorkflowId) => void;
export declare const isPromptLimitExceeded: (role: UserRole, promptsAsked: number, hasOwnApiKey: boolean) => boolean;
//# sourceMappingURL=rbac.d.ts.map