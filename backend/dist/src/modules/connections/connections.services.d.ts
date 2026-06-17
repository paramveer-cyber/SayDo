import { type PluginId } from "./connections.config.js";
export declare const getConnectionStatus: (userId: string) => Promise<Record<PluginId, boolean>>;
export declare const connectPlugin: (userId: string, plugin: PluginId, authCode: string) => Promise<{
    connected: boolean;
}>;
export declare const getPluginAccessToken: (userId: string, plugin: PluginId) => Promise<{
    token: null;
    expiry: null;
} | {
    token: string;
    expiry: number;
}>;
export declare const disconnectPlugin: (userId: string, plugin: PluginId) => Promise<{
    connected: boolean;
}>;
//# sourceMappingURL=connections.services.d.ts.map