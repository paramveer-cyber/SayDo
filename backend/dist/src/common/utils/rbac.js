const ROLE_RANK = {
    user: 0,
    bronze_subscriber: 1,
    silver_subscriber: 2,
    gold_subscriber: 3,
    admin: 99,
};
export const roleAtLeast = (role, minimum) => ROLE_RANK[role] >= ROLE_RANK[minimum];
export const PROMPT_LIMITS = {
    user: 5,
    bronze_subscriber: 50,
    silver_subscriber: 200,
    gold_subscriber: 1000,
    admin: Infinity,
};
const WORKFLOW_MINIMUM_ROLE = {
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
export const canAccessWorkflow = (role, workflowId) => roleAtLeast(role, WORKFLOW_MINIMUM_ROLE[workflowId]);
export const assertWorkflowAccess = (role, workflowId) => {
    if (!canAccessWorkflow(role, workflowId)) {
        throw new Error(`Role '${role}' does not have access to workflow '${workflowId}'`);
    }
};
export const isPromptLimitExceeded = (role, promptsAsked, hasOwnApiKey) => {
    if (hasOwnApiKey)
        return false;
    return promptsAsked >= PROMPT_LIMITS[role];
};
//# sourceMappingURL=rbac.js.map