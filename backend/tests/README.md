# Tests

Integration tests for each backend module. Each file runs against a live server using native `fetch` — no test framework needed.

## Setup

```bash
# Server must be running
npm run dev

# Install tsx if not already present (it's in devDependencies)
npm install
```

## Running

```bash
# All suites
npx tsx tests/index.ts

# Single suite
npx tsx tests/auth.test.ts
npx tsx tests/gmail.test.ts
npx tsx tests/calendar.test.ts
npx tsx tests/ai.test.ts
npx tsx tests/webhooks.test.ts
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `API_URL` | `http://localhost:3000` | Base URL of the running server |
| `TEST_TOKEN` | — | **Required** for Gmail, Calendar, and AI tests. A valid JWT access token from a user with those services connected. Get one by calling `POST /auth/login` first. |

### Getting a TEST_TOKEN

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.data.token'
```

Then export it:

```bash
export TEST_TOKEN=<token from above>
npx tsx tests/index.ts
```

## Files

| File | Module | What it tests |
|---|---|---|
| `auth.test.ts` | `/auth` | register, login, Google auth, refresh, me, connect-link, logout, delete account |
| `gmail.test.ts` | `/gmail` | messages (list/get/send/modify/trash/sync), threads, drafts (CRUD), labels (CRUD), workflows |
| `calendar.test.ts` | `/calendar` | events (list/get/create/update/delete), availability |
| `ai.test.ts` | `/ai` | prompt (valid, invalid body, rate limit paths, unauthenticated) |
| `webhooks.test.ts` | `/webhooks` | health, pubsub ingestion, duplicate suppression, malformed payloads |
| `runner.ts` | — | Shared utilities: `test`, `assert`, `assertStatus`, `json`, headers |
