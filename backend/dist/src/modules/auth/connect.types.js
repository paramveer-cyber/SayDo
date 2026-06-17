export const PLUGIN_REGISTRY = [
    {
        id: "gmail",
        label: "Gmail",
        scopes: [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.modify",
        ],
        required: true,
    },
    {
        id: "googlecalendar",
        label: "Google Calendar",
        scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
        ],
        required: true,
    },
];
export const PLUGIN_MAP = Object.fromEntries(PLUGIN_REGISTRY.map((p) => [p.id, p]));
//# sourceMappingURL=connect.types.js.map