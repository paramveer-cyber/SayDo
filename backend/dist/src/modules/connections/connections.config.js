export const PLUGIN_SCOPES = {
    gmail: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
    ],
    googlecalendar: [
        "https://www.googleapis.com/auth/calendar",
    ],
};
export const PLUGIN_IDS = Object.keys(PLUGIN_SCOPES);
export const isPluginId = (value) => PLUGIN_IDS.includes(value);
//# sourceMappingURL=connections.config.js.map