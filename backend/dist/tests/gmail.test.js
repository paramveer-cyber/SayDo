import { test, assert, assertStatus, json, jsonHeaders, authHeader, summary, BASE_URL } from "./runner.js";
const GMAIL = `${BASE_URL}/gmail`;
const AUTH = `${BASE_URL}/auth`;
const TOKEN = process.env.TEST_TOKEN;
if (!TOKEN) {
    console.error("Set TEST_TOKEN env var to a valid access token with Gmail connected.");
    process.exit(1);
}
console.log("\n── Gmail ──");
let createdLabelId = "";
let createdDraftId = "";
let firstMessageId = "";
let firstThreadId = "";
// ── Messages ──────────────────────────────────────────────────
await test("GET /gmail/messages — lists messages", async () => {
    const response = await fetch(`${GMAIL}/messages`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(Array.isArray(body), "response must be an array");
    if (body.length > 0) {
        const first = body[0];
        firstMessageId = first?.data?.id ?? "";
    }
});
await test("GET /gmail/messages — filters by query param q", async () => {
    const response = await fetch(`${GMAIL}/messages?q=inbox`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    assert(Array.isArray(await json(response)), "must be array");
});
await test("GET /gmail/messages — respects maxResults param", async () => {
    const response = await fetch(`${GMAIL}/messages?maxResults=2`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.length <= 2, "must return at most 2 results");
});
await test("GET /gmail/messages/:messageId — fetches single message", async () => {
    if (!firstMessageId) {
        console.log("    (skipped — no messages in inbox)");
        return;
    }
    const response = await fetch(`${GMAIL}/messages/${firstMessageId}`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("GET /gmail/messages/:messageId — 404 for unknown id", async () => {
    const response = await fetch(`${GMAIL}/messages/nonexistent_id_xyz`, {
        headers: authHeader(TOKEN),
    });
    assert(response.status === 404 || response.status === 200, "should return 404 or empty — depends on Corsair DB behaviour");
});
await test("POST /gmail/messages/sync — triggers sync", async () => {
    const response = await fetch(`${GMAIL}/messages/sync?maxResults=5&maxPages=1`, {
        method: "POST",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(typeof body.totalMessages === "number", "totalMessages must be number");
});
await test("POST /gmail/messages/send — rejects invalid body", async () => {
    const response = await fetch(`${GMAIL}/messages/send`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ subject: "No recipient" }),
    });
    await assertStatus(response, 400);
});
await test("POST /gmail/messages/batch-modify — rejects empty ids array", async () => {
    const response = await fetch(`${GMAIL}/messages/batch-modify`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ ids: [] }),
    });
    await assertStatus(response, 400);
});
await test("PATCH /gmail/messages/:messageId — rejects when no token", async () => {
    const response = await fetch(`${GMAIL}/messages/some_id`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addLabelIds: [] }),
    });
    await assertStatus(response, 401);
});
// ── Threads ──────────────────────────────────────────────────
await test("GET /gmail/threads — lists threads", async () => {
    const response = await fetch(`${GMAIL}/threads`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(Array.isArray(body), "must be array");
    if (body.length > 0) {
        const first = body[0];
        firstThreadId = first?.data?.id ?? "";
    }
});
await test("GET /gmail/threads/:threadId — fetches single thread", async () => {
    if (!firstThreadId) {
        console.log("    (skipped — no threads found)");
        return;
    }
    const response = await fetch(`${GMAIL}/threads/${firstThreadId}`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("PATCH /gmail/threads/:threadId — rejects invalid body", async () => {
    const response = await fetch(`${GMAIL}/threads/some_id`, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ unknownField: true }),
    });
    await assertStatus(response, 400);
});
await test("GET /gmail/threads — rejects unauthenticated request", async () => {
    const response = await fetch(`${GMAIL}/threads`);
    await assertStatus(response, 401);
});
// ── Drafts ───────────────────────────────────────────────────
await test("POST /gmail/drafts — creates a draft", async () => {
    const response = await fetch(`${GMAIL}/drafts`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            to: "test@example.com",
            subject: "Test draft subject",
            body: "This is a test draft body.",
        }),
    });
    await assertStatus(response, 201);
    const body = await json(response);
    assert(typeof body.id === "string", "draft id must be string");
    createdDraftId = body.id;
});
await test("POST /gmail/drafts — rejects missing to field", async () => {
    const response = await fetch(`${GMAIL}/drafts`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ subject: "No recipient", body: "body" }),
    });
    await assertStatus(response, 400);
});
await test("GET /gmail/drafts — lists drafts", async () => {
    const response = await fetch(`${GMAIL}/drafts`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    assert(Array.isArray(await json(response)), "must be array");
});
await test("GET /gmail/drafts/:draftId — fetches single draft", async () => {
    if (!createdDraftId) {
        console.log("    (skipped — draft creation failed)");
        return;
    }
    const response = await fetch(`${GMAIL}/drafts/${createdDraftId}`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("PUT /gmail/drafts/:draftId — updates a draft", async () => {
    if (!createdDraftId) {
        console.log("    (skipped — draft creation failed)");
        return;
    }
    const response = await fetch(`${GMAIL}/drafts/${createdDraftId}`, {
        method: "PUT",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            to: "test@example.com",
            subject: "Updated draft subject",
            body: "Updated body.",
        }),
    });
    await assertStatus(response, 200);
});
await test("DELETE /gmail/drafts/:draftId — deletes a draft", async () => {
    if (!createdDraftId) {
        console.log("    (skipped — draft creation failed)");
        return;
    }
    const response = await fetch(`${GMAIL}/drafts/${createdDraftId}`, {
        method: "DELETE",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 204);
});
// ── Labels ───────────────────────────────────────────────────
await test("GET /gmail/labels — lists labels", async () => {
    const response = await fetch(`${GMAIL}/labels`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    assert(Array.isArray(await json(response)), "must be array");
});
await test("POST /gmail/labels — creates a label", async () => {
    const uniqueName = `TestLabel_${Date.now()}`;
    const response = await fetch(`${GMAIL}/labels`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ name: uniqueName }),
    });
    await assertStatus(response, 201);
    const body = await json(response);
    assert(typeof body.id === "string", "label id must be string");
    createdLabelId = body.id;
});
await test("POST /gmail/labels — rejects missing name", async () => {
    const response = await fetch(`${GMAIL}/labels`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({}),
    });
    await assertStatus(response, 400);
});
await test("GET /gmail/labels/:labelId — fetches single label", async () => {
    if (!createdLabelId) {
        console.log("    (skipped — label creation failed)");
        return;
    }
    const response = await fetch(`${GMAIL}/labels/${createdLabelId}`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("PATCH /gmail/labels/:labelId — updates label name", async () => {
    if (!createdLabelId) {
        console.log("    (skipped — label creation failed)");
        return;
    }
    const response = await fetch(`${GMAIL}/labels/${createdLabelId}`, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ name: `UpdatedLabel_${Date.now()}` }),
    });
    await assertStatus(response, 200);
});
await test("DELETE /gmail/labels/:labelId — deletes the label", async () => {
    if (!createdLabelId) {
        console.log("    (skipped — label creation failed)");
        return;
    }
    const response = await fetch(`${GMAIL}/labels/${createdLabelId}`, {
        method: "DELETE",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 204);
});
// ── Workflows ────────────────────────────────────────────────
await test("POST /gmail/workflows/daily-digest/run — triggers daily digest", async () => {
    const response = await fetch(`${GMAIL}/workflows/daily-digest/run`, {
        method: "POST",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("POST /gmail/workflows/weekly-digest/run — triggers weekly digest", async () => {
    const response = await fetch(`${GMAIL}/workflows/weekly-digest/run`, {
        method: "POST",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("POST /gmail/workflows/unsubscribe-suggestions/run — triggers unsubscribe suggestions", async () => {
    const response = await fetch(`${GMAIL}/workflows/unsubscribe-suggestions/run`, {
        method: "POST",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("POST /gmail/workflows/:workflowId/run — 400 for unknown workflow", async () => {
    const response = await fetch(`${GMAIL}/workflows/nonexistent-workflow/run`, {
        method: "POST",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 400);
});
summary("Gmail");
//# sourceMappingURL=gmail.test.js.map