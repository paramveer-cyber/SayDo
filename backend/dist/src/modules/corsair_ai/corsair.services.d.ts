import "dotenv/config";
import type { UserSettingsRow } from "./corsair.modals.js";
import type { UserRole } from "../../common/utils/rbac.js";
export declare const sendAIPrompt: (userPrompt: string, useLocalModel: boolean, accessToken: string, mcpURL?: string, settings?: UserSettingsRow | null, rawHistory?: string[], userRole?: UserRole) => Promise<string>;
//# sourceMappingURL=corsair.services.d.ts.map