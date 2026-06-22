export declare const corsair: import("corsair/core").CorsairTenantWrapper<readonly [import("@corsair-dev/gmail").ExternalGmailPlugin<{
    readonly authType: "oauth_2";
    readonly webhookHooks: {
        readonly messageChanged: {
            readonly after: (ctx: any, response: import("corsair/core").WebhookResponse<GmailWebhookOutputs>) => Promise<void>;
        };
    };
}>, import("@corsair-dev/googlecalendar").ExternalGoogleCalendarPlugin<{
    readonly authType: "oauth_2";
}>]>;
//# sourceMappingURL=corsair.d.ts.map