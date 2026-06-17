import type { ModelMessage } from "ai";
import type { UserRole } from "./rbac.js";
export declare function sanitizeHistory(rawHistory: string[] | undefined): string[];
export declare function filterHistoryByPlan(history: string[], role?: UserRole): string[];
export declare function buildMessagesFromHistory(history: string[], finalPrompt: string): ModelMessage[];
//# sourceMappingURL=chatHistory.d.ts.map