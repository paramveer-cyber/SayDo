import { z } from "zod";
import { PLUGIN_IDS } from "./connections.config.js";
export const PluginParamSchema = z.object({
    plugin: z.enum(PLUGIN_IDS),
});
export const ExchangeAuthCodeSchema = z.object({
    authCode: z.string().min(1),
});
//# sourceMappingURL=connections.modal.js.map