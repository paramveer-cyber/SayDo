import { test, assert, assertStatus, json, jsonHeaders, authHeader, summary, BASE_URL, } from "./runner.js";
const SETTINGS = `${BASE_URL}/settings`;
const TOKEN = process.env.TEST_TOKEN;
if (!TOKEN) {
    console.error("Set TEST_TOKEN env var to a valid access token.");
    process.exit(1);
}
console.log("\n── Settings ──");
await test("GET /settings — fetches settings, creating defaults if missing", async () => {
    const response = await fetch(SETTINGS, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(typeof body.data.settings === "object", "settings must be an object");
});
await test("GET /settings — rejects unauthenticated request", async () => {
    const response = await fetch(SETTINGS);
    await assertStatus(response, 401);
});
await test("PATCH /settings — updates preferredModel", async () => {
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ preferredModel: "gemini-2.5-flash" }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.data.settings.preferredModel === "gemini-2.5-flash", "preferredModel must be updated");
});
await test("PATCH /settings — updates approvalsRequired boolean", async () => {
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ approvalsRequired: true }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.data.settings.approvalsRequired === true, "approvalsRequired must be true");
});
await test("PATCH /settings — accepts keybinds map", async () => {
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            keybinds: { archiveEmail: { key: "e", ctrl: true } },
        }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.data.settings.keybinds.archiveEmail?.key === "e", "keybind must be persisted");
});
await test("PATCH /settings — rejects systemPromptOverride over 4000 chars", async () => {
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ systemPromptOverride: "a".repeat(4001) }),
    });
    await assertStatus(response, 400);
});
await test("PATCH /settings — rejects geminiApiKey over 500 chars", async () => {
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ geminiApiKey: "a".repeat(501) }),
    });
    await assertStatus(response, 400);
});
await test("PATCH /settings — rejects too many keybinds", async () => {
    const tooManyKeybinds = {};
    for (let index = 0; index < 101; index++) {
        tooManyKeybinds[`action${index}`] = { key: String(index) };
    }
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ keybinds: tooManyKeybinds }),
    });
    await assertStatus(response, 400);
});
await test("PATCH /settings — accepts null geminiApiKey to clear it", async () => {
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ geminiApiKey: null }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    assert(body.data.settings.geminiApiKey === null, "geminiApiKey must be null");
});
await test("PATCH /settings — rejects unauthenticated request", async () => {
    const response = await fetch(SETTINGS, {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify({ preferredModel: "gemini-2.5-flash" }),
    });
    await assertStatus(response, 401);
});
summary("Settings");
//# sourceMappingURL=settings.test.js.map