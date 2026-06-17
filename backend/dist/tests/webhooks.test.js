import { test, assert, assertStatus, json, summary, BASE_URL } from "./runner.js";
const WEBHOOKS = `${BASE_URL}/webhooks`;
console.log("\n── Webhooks ──");
const makePubSubBody = (data) => ({
    message: {
        data: Buffer.from(JSON.stringify(data)).toString("base64"),
        messageId: "test-message-id",
        publishTime: new Date().toISOString(),
    },
    subscription: "projects/test/subscriptions/gmail-push",
});
await test("GET /webhooks — health check returns ok", async () => {
    const response = await fetch(WEBHOOKS);
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.status === "ok", "status must be ok");
});
await test("POST /webhooks — accepts valid pubsub payload with tenantId", async () => {
    const response = await fetch(`${WEBHOOKS}?tenant=test-tenant-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makePubSubBody({ historyId: "12345", emailAddress: "test@example.com" })),
    });
    assert(response.status === 200 || response.status === 404, `expected 200 or 404 (no handler matched), got ${response.status}`);
});
await test("POST /webhooks — handles duplicate historyId gracefully", async () => {
    const payload = JSON.stringify(makePubSubBody({ historyId: "duplicate-id", emailAddress: "test@example.com" }));
    const headers = { "Content-Type": "application/json" };
    await fetch(`${WEBHOOKS}?tenant=test-tenant-id`, {
        method: "POST",
        headers,
        body: payload,
    });
    const secondResponse = await fetch(`${WEBHOOKS}?tenant=test-tenant-id`, {
        method: "POST",
        headers,
        body: payload,
    });
    await assertStatus(secondResponse, 200);
    const body = await json(secondResponse);
    assert(body.success === true, "duplicate should return success: true");
});
await test("POST /webhooks — handles payload without tenantId", async () => {
    const response = await fetch(WEBHOOKS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ someField: "someValue" }),
    });
    assert(response.status === 200 || response.status === 404, `expected 200 or 404, got ${response.status}`);
});
await test("POST /webhooks — handles empty body gracefully", async () => {
    const response = await fetch(WEBHOOKS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
    });
    assert(response.status !== 500, "must not 500 on empty body");
});
await test("POST /webhooks — handles malformed base64 data without crashing", async () => {
    const response = await fetch(`${WEBHOOKS}?tenant=test-tenant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: {
                data: "!!!not-valid-base64!!!",
                messageId: "test",
            },
        }),
    });
    assert(response.status !== 500, "must not 500 on bad base64");
});
summary("Webhooks");
//# sourceMappingURL=webhooks.test.js.map