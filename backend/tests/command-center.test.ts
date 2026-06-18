import {
  test,
  assert,
  assertStatus,
  json,
  authHeader,
  summary,
  BASE_URL,
} from "./runner.js";

const COMMAND_CENTER = `${BASE_URL}/command-center`;

const TOKEN = process.env.TEST_TOKEN;

if (!TOKEN) {
  console.error(
    "Set TEST_TOKEN env var to a valid access token with Gmail and Calendar connected.",
  );
  process.exit(1);
}

console.log("\n── Command Center ──");

type CommandCenterOverview = {
  emailsNeedingAttention: unknown[];
  meetingsToday: unknown[];
  conflictsDetected: unknown[];
  followUpsDue: unknown[];
  generatedAt: string;
};

await test("GET /command-center/overview — returns full overview shape", async () => {
  const response = await fetch(`${COMMAND_CENTER}/overview`, {
    headers: authHeader(TOKEN),
  });
  await assertStatus(response, 200);
  const body = await json<CommandCenterOverview>(response);
  assert(
    Array.isArray(body.emailsNeedingAttention),
    "emailsNeedingAttention must be an array",
  );
  assert(Array.isArray(body.meetingsToday), "meetingsToday must be an array");
  assert(
    Array.isArray(body.conflictsDetected),
    "conflictsDetected must be an array",
  );
  assert(Array.isArray(body.followUpsDue), "followUpsDue must be an array");
  assert(typeof body.generatedAt === "string", "generatedAt must be a string");
});

await test("GET /command-center/overview — respects custom timeMin and timeMax", async () => {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setUTCHours(23, 59, 59, 0);

  const response = await fetch(
    `${COMMAND_CENTER}/overview?timeMin=${dayStart.toISOString()}&timeMax=${dayEnd.toISOString()}`,
    { headers: authHeader(TOKEN) },
  );
  await assertStatus(response, 200);
  const body = await json<CommandCenterOverview>(response);
  assert(Array.isArray(body.meetingsToday), "meetingsToday must be an array");
});

await test("GET /command-center/overview — emailsNeedingAttention items have expected fields", async () => {
  const response = await fetch(`${COMMAND_CENTER}/overview`, {
    headers: authHeader(TOKEN),
  });
  await assertStatus(response, 200);
  const body = await json<CommandCenterOverview>(response);
  if (body.emailsNeedingAttention.length === 0) {
    console.log("    (skipped — no unread inbox messages)");
    return;
  }
  const first = body.emailsNeedingAttention[0] as {
    messageId: string;
    subject: string;
    isHighPriority: boolean;
  };
  assert(typeof first.messageId === "string", "messageId must be a string");
  assert(typeof first.subject === "string", "subject must be a string");
  assert(
    typeof first.isHighPriority === "boolean",
    "isHighPriority must be a boolean",
  );
});

await test("GET /command-center/overview — conflictsDetected items have overlap window when present", async () => {
  const response = await fetch(`${COMMAND_CENTER}/overview`, {
    headers: authHeader(TOKEN),
  });
  await assertStatus(response, 200);
  const body = await json<CommandCenterOverview>(response);
  if (body.conflictsDetected.length === 0) {
    console.log("    (skipped — no overlapping meetings today)");
    return;
  }
  const first = body.conflictsDetected[0] as {
    overlapStart: string;
    overlapEnd: string;
  };
  assert(
    typeof first.overlapStart === "string",
    "overlapStart must be a string",
  );
  assert(typeof first.overlapEnd === "string", "overlapEnd must be a string");
});

await test("GET /command-center/overview — rejects unauthenticated request", async () => {
  const response = await fetch(`${COMMAND_CENTER}/overview`);
  await assertStatus(response, 401);
});

await test("GET /command-center/overview — rejects invalid token", async () => {
  const response = await fetch(`${COMMAND_CENTER}/overview`, {
    headers: authHeader("invalid.token.here"),
  });
  await assertStatus(response, 401);
});

summary("Command Center");
