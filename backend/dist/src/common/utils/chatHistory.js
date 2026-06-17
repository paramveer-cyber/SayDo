const MAX_HISTORY_ITEMS = 20;
const MAX_ITEM_LENGTH = 4000;
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
function stripControlChars(value) {
    return value.replace(CONTROL_CHARS_REGEX, "").trim();
}
export function sanitizeHistory(rawHistory) {
    if (!rawHistory || rawHistory.length === 0)
        return [];
    return rawHistory
        .slice(-MAX_HISTORY_ITEMS)
        .map((entry) => stripControlChars(String(entry)).slice(0, MAX_ITEM_LENGTH))
        .filter((entry) => entry.length > 0);
}
const HISTORY_TURN_LIMITS = {
    user: 4,
    bronze_subscriber: 8,
    silver_subscriber: 14,
    gold_subscriber: 20,
    admin: 20,
};
export function filterHistoryByPlan(history, role = "user") {
    const limit = HISTORY_TURN_LIMITS[role];
    return history.slice(-limit);
}
export function buildMessagesFromHistory(history, finalPrompt) {
    const historyMessages = history.map((entry, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: entry,
    }));
    return [...historyMessages, { role: "user", content: finalPrompt }];
}
//# sourceMappingURL=chatHistory.js.map