export type PluginId = "gmail" | "googlecalendar";
export type PluginDefinition = {
    id: PluginId;
    label: string;
    scopes: string[];
    required: boolean;
};
export declare const PLUGIN_REGISTRY: PluginDefinition[];
export declare const PLUGIN_MAP: Record<PluginId, PluginDefinition>;
//# sourceMappingURL=connect.types.d.ts.map