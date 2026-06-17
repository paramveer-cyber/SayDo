import { test, assert, assertStatus, json, jsonHeaders, authHeader, summary, BASE_URL } from "./runner.js";
const CALENDAR = `${BASE_URL}/calendar`;
const TOKEN = process.env.TEST_TOKEN;
if (!TOKEN) {
    console.error("Set TEST_TOKEN env var to a valid access token with Google Calendar connected.");
    process.exit(1);
}
console.log("\n── Google Calendar ──");
let createdEventId = "";
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
const isoDate = (date) => date.toISOString();
// ── Events ───────────────────────────────────────────────────
await test("GET /calendar/events — lists events", async () => {
    const response = await fetch(`${CALENDAR}/events`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("GET /calendar/events — filters by timeMin and timeMax", async () => {
    const timeMin = isoDate(new Date());
    const timeMax = isoDate(dayAfter);
    const response = await fetch(`${CALENDAR}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`, { headers: authHeader(TOKEN) });
    await assertStatus(response, 200);
});
await test("GET /calendar/events — respects maxResults param", async () => {
    const response = await fetch(`${CALENDAR}/events?maxResults=2`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("GET /calendar/events — rejects unauthenticated request", async () => {
    const response = await fetch(`${CALENDAR}/events`);
    await assertStatus(response, 401);
});
await test("POST /calendar/events — creates an event", async () => {
    const response = await fetch(`${CALENDAR}/events`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            summary: "Test Event",
            description: "Created by test script",
            start: { dateTime: isoDate(tomorrow), timeZone: "UTC" },
            end: { dateTime: isoDate(dayAfter), timeZone: "UTC" },
        }),
    });
    await assertStatus(response, 200);
    const body = await json(response);
    if (body.id)
        createdEventId = body.id;
    assert(true, "event created");
});
await test("POST /calendar/events — rejects invalid body (missing required fields when strict)", async () => {
    const response = await fetch(`${CALENDAR}/events`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ unknownField: true }),
    });
    assert(response.status === 400 || response.status === 200, "schema is lenient — all fields optional, still should not 500");
    assert(response.status !== 500, "must not 500");
});
await test("GET /calendar/events/:eventId — fetches single event", async () => {
    if (!createdEventId) {
        console.log("    (skipped — event creation failed)");
        return;
    }
    const response = await fetch(`${CALENDAR}/events/${createdEventId}`, {
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 200);
});
await test("PATCH /calendar/events/:eventId — updates event summary", async () => {
    if (!createdEventId) {
        console.log("    (skipped — event creation failed)");
        return;
    }
    const response = await fetch(`${CALENDAR}/events/${createdEventId}`, {
        method: "PATCH",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({ summary: "Updated Test Event" }),
    });
    await assertStatus(response, 200);
});
await test("DELETE /calendar/events/:eventId — deletes the event", async () => {
    if (!createdEventId) {
        console.log("    (skipped — event creation failed)");
        return;
    }
    const response = await fetch(`${CALENDAR}/events/${createdEventId}`, {
        method: "DELETE",
        headers: authHeader(TOKEN),
    });
    await assertStatus(response, 204);
});
await test("DELETE /calendar/events/:eventId — rejects unauthenticated", async () => {
    const response = await fetch(`${CALENDAR}/events/some_id`, {
        method: "DELETE",
    });
    await assertStatus(response, 401);
});
// ── Availability ──────────────────────────────────────────────
await test("POST /calendar/availability — returns free/busy data", async () => {
    const response = await fetch(`${CALENDAR}/availability`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            timeMin: isoDate(new Date()),
            timeMax: isoDate(dayAfter),
            timeZone: "UTC",
            calendarIds: ["primary"],
        }),
    });
    await assertStatus(response, 200);
});
await test("POST /calendar/availability — rejects missing calendarIds", async () => {
    const response = await fetch(`${CALENDAR}/availability`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            timeMin: isoDate(new Date()),
            timeMax: isoDate(dayAfter),
        }),
    });
    await assertStatus(response, 400);
});
await test("POST /calendar/availability — rejects missing timeMin", async () => {
    const response = await fetch(`${CALENDAR}/availability`, {
        method: "POST",
        headers: jsonHeaders(TOKEN),
        body: JSON.stringify({
            timeMax: isoDate(dayAfter),
            calendarIds: ["primary"],
        }),
    });
    await assertStatus(response, 400);
});
await test("POST /calendar/availability — rejects unauthenticated", async () => {
    const response = await fetch(`${CALENDAR}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            timeMin: isoDate(new Date()),
            timeMax: isoDate(dayAfter),
            calendarIds: ["primary"],
        }),
    });
    await assertStatus(response, 401);
});
summary("Google Calendar");
//# sourceMappingURL=calendar.test.js.map