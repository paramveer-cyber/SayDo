import "dotenv/config";
import type { userSettings } from "../../db/schema.js";
type UserSettingsRow = typeof userSettings.$inferSelect;
export declare const sendAIPrompt: (userPrompt: string, useLocalModel: boolean, accessToken: string, mcpURL?: string, settings?: UserSettingsRow | null) => Promise<string>;
export {};
//# sourceMappingURL=corsair.services.d.ts.map