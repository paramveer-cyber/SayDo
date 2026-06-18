import {
  test,
  assert,
  assertStatus,
  json,
  jsonHeaders,
  authHeader,
  summary,
  BASE_URL,
} from "./runner.js";

const AI = `${BASE_URL}/ai`;

const TOKEN = process.env.TEST_TOKEN;

if (!TOKEN) {
  console.error("Set TEST_TOKEN env var to a valid access token.");
  process.exit(1);
}

console.log("\n── AI (Corsair) ──");

await test("POST /ai/prompt — returns AI response for valid prompt", async () => {
  const response = await fetch(`${AI}/prompt`, {
    method: "POST",
    headers: jsonHeaders(TOKEN),
    body: JSON.stringify({
      prompt: "Say hello in one word.",
    }),
  });
  await assertStatus(response, 200);
  const body = await json<{ data: unknown }>(response);
  assert(body.data !== undefined, "response must have data field");
});

await test("POST /ai/prompt — rejects empty prompt", async () => {
  const response = await fetch(`${AI}/prompt`, {
    method: "POST",
    headers: jsonHeaders(TOKEN),
    body: JSON.stringify({ prompt: "" }),
  });
  await assertStatus(response, 400);
});

await test("POST /ai/prompt — rejects prompt over 512 chars", async () => {
  const response = await fetch(`${AI}/prompt`, {
    method: "POST",
    headers: jsonHeaders(TOKEN),
    body: JSON.stringify({ prompt: "a".repeat(513) }),
  });
  await assertStatus(response, 400);
});

await test("POST /ai/prompt — rejects missing prompt field", async () => {
  const response = await fetch(`${AI}/prompt`, {
    method: "POST",
    headers: jsonHeaders(TOKEN),
    body: JSON.stringify({}),
  });
  await assertStatus(response, 400);
});

await test("POST /ai/prompt — rejects unauthenticated request", async () => {
  const response = await fetch(`${AI}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "hello" }),
  });
  await assertStatus(response, 401);
});

await test("POST /ai/prompt — accepts optional mcpServer param", async () => {
  const response = await fetch(`${AI}/prompt`, {
    method: "POST",
    headers: jsonHeaders(TOKEN),
    body: JSON.stringify({
      prompt: "Say hello in one word.",
      mcpServer: `${BASE_URL}/mcp`,
    }),
  });
  await assertStatus(response, 200);
});

summary("AI");
