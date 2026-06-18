# Corsair Hackathon — Backend

An Express + TypeScript API that turns Gmail and Google Calendar into an AI-driven command center: a single conversational assistant that can read, triage, draft, and act across both, backed by real-time push updates, role-based workflow automation, and scheduled digests.

```
+------------------------------------------------------------------+
|                      AI-powered inbox & calendar                 |
|                          command center                          |
+------------------------------------------------------------------+
```

## Tech stack

```
Runtime / Framework   Express 5, TypeScript, Node (ESM)
Data layer             PostgreSQL + drizzle-orm + drizzle-kit
Integrations           Corsair SDK (@corsair-dev/gmail, @corsair-dev/googlecalendar)
AI                      Google Gemini via @ai-sdk/google + @openai/agents tool-calling
Background jobs        Inngest
Realtime push           Server-Sent Events (SSE)
Payments                Razorpay
Auth                    JWT (access + refresh) and Google OAuth
Validation              Zod
Security                helmet, cors, express-rate-limit, bcryptjs
```

## High-level architecture

```
                         +---------------------------+
                         |     Next.js Frontend       |
                         +-------------+---------------+
                                       | HTTPS (REST + SSE)
                                       v
   +-----------------------------------------------------------------+
   |                          Express API (this repo)                 |
   |   helmet -> cors -> json/cookie parsers -> route mounting         |
   +----+----------+-----------+-------------+-----------+------------+
        |          |           |             |           |
        v          v           v             v           v
     /auth       /ai        /gmail        /calendar    /webhooks
     /settings  (Gemini +   /command-center            /api/inngest
                 MCP tools)
        |          |           |             |           |
        v          v           v             v           v
     JWT +      Corsair MCP   Corsair SDK   Corsair SDK  Google Pub/Sub
     Google     tool router   (Gmail)       (Calendar)   -> Inngest jobs
     OAuth
        \\         |           /             /
         \\        v          v             /
          +---->  PostgreSQL (drizzle-orm)  <----+
                  users, settings, corsair_*
```

## Project structure

```
backend/
|-- src/
|   |-- common/
|   |   |-- config/        Inngest client, Pub/Sub client, cookie options
|   |   |-- middleware/     error handler, rate limiter, zod validate()
|   |   `-- utils/          aiProvider, rbac, tokenLogic, chatHistory, api-error
|   |-- db/                 drizzle schema + pool/connection
|   |-- modules/
|   |   |-- auth/           register, login, Google OAuth, JWT refresh
|   |   |-- gmail/          messages, threads, drafts, labels, workflows
|   |   |-- googlecalendar/ events CRUD + availability
|   |   |-- corsair_ai/     /ai/prompt — the conversational agent endpoint
|   |   |-- command-center/ aggregated "what needs my attention" overview
|   |   |-- inngest/        9 background functions + their system prompts
|   |   |-- settings/       per-user AI + workflow preferences
|   |   |-- razorpay/       order creation + payment verification
|   |   |-- sse/             /sse/stream — push channel to the frontend
|   |   `-- webhooks/        Corsair Pub/Sub webhook ingestion
|   |-- types/
|   |-- app.ts               route mounting + middleware pipeline
|   `-- corsair.ts           Corsair SDK instance (plugins, KEK, multi-tenancy)
|-- tests/                    fetch-based integration suite, one file per module
|-- drizzle.config.ts
`-- package.json
```

## Request lifecycle

```
Client
  |
  |--- HTTP request -------------------> Express app
  |                                          |
  |                                     helmet / cors
  |                                          |
  |                                     cookie + json parsing
  |                                          |
  |                                     authMiddleware (verifies JWT)
  |                                          |
  |                                     route-level validate(zodSchema)
  |                                          |
  |                                     controller -> service layer
  |                                          |
  |                                     drizzle-orm  /  Corsair SDK
  |                                          |
  |<-- { success, message, data } ----------|
```

## Auth

Two entry points feed the same JWT session model — a short-lived access token plus a long-lived refresh token, both delivered as httpOnly cookies and also returned in the JSON body for clients that prefer bearer auth.

```
Local credentials                     Google OAuth (via Corsair)
------------------                     ---------------------------
POST /auth/register                    GET /auth/connect-link
  -> bcrypt hash password                -> Corsair builds the OAuth URL
  -> create user row                   GET /auth/callback
  -> issue access + refresh JWT           -> Corsair exchanges the code
                                           -> Gmail/Calendar linked to tenant
POST /auth/login                          -> redirect back to the frontend
  -> verify password
  -> issue access + refresh JWT

POST /auth/refresh
  -> verify refresh JWT -> issue new access JWT
```

`GET /auth/me` returns the current user; `DELETE /auth/plugins/:pluginId` cleanly unlinks Gmail or Calendar; `DELETE /auth/account` removes the user entirely.

## The AI agent (`/ai/prompt`)

The assistant is a Gemini model wired up with full tool-calling access to every Corsair operation through an MCP (Model Context Protocol) server, so it can discover available actions, fetch their schema, and run them — all inside one guarded request.

```
ChatSection (frontend)
   |
   |  POST /ai/prompt { prompt, requestId, options.history }
   v
authMiddleware -> injectUserSettings -> aiRateLimiter -> promptAI
   |
   |  rbac.ts: role-based prompt-quota check
   v
sendAIPrompt()
   |
   |--> createVercelAiMcpClient(/mcp)  ----tools---->  Corsair MCP server
   |--> resolveAiModel(settings)       ----model---->  Gemini (default or user's own key)
   v
generateText({ model, tools, system, messages })
   |
   |  onStepFinish -> sendEventToUser("agent_step")  --SSE-->  live step indicator
   v
final answer text  ------------------------------------------>  JSON response
```

Each user gets a per-role prompt allowance, with unlimited use available the moment they add their own Gemini key:

```
admin               unlimited prompts
gold_subscriber      1000 prompts
silver_subscriber     200 prompts
bronze_subscriber      50 prompts
user                    5 prompts
```

## Command Center

`GET /command-center/overview` gives the dashboard everything it needs in one round trip by querying Corsair's locally synced Gmail + Calendar data directly (no live API calls), then ranking and merging the results:

```
+-------------------------+      +--------------------------+
|  Emails needing          |      |  Meetings today           |
|  attention (priority-    | ---> |  + conflicts detected      | ---> Command Center
|  ranked, unread inbox)    |      |  + follow-ups due           |       overview
+-------------------------+      +--------------------------+
```

## Background automation (Inngest)

Workflows are triggered either by a user clicking "run" in the dashboard (`POST /gmail/workflows/:workflowId/run`) or by Gmail push notifications arriving through the webhook. Every workflow is RBAC-gated before it ever reaches Inngest.

```
Workflow request                Inngest event                          Function
-----------------                --------------------------------      ----------------------------------
new Gmail message  ----------->  email/received                  -->  onEmailReceivedAssignPriority
"Weekly digest"     ----------->  digest/weekly.requested          -->  onWeeklyDigestRequested
"Daily digest"      ----------->  digest/daily.requested           -->  onDailyDigestRequested
"Unsubscribe scan"  ----------->  digest/unsubscribe.requested      -->  onUnsubscribeSuggestionsRequested
"Follow-up scan"    ----------->  digest/followup-scan.requested    -->  onFollowupScanRequested
"Bulk cleanup"      ----------->  digest/bulk-cleanup.requested     -->  onBulkCleanupRequested
"Week-prep brief"   ----------->  calendar/week-prep.requested      -->  onWeekPrepBriefingRequested
"Conflict detect"   ----------->  calendar/conflict-detection.requested -> onConflictDetectionRequested
"Bulk prioritize"   ----------->  digest/bulk-prioritize-week.requested -> onBulkPrioritizeWeekRequested
```

## Realtime pipeline

Gmail changes reach the frontend within moments of happening, via Google Pub/Sub straight through to an open SSE connection:

```
Gmail / Calendar change
        |
        v
Google Pub/Sub  --push-->  POST /webhooks  (Corsair processWebhook)
        |
        v
canAccessWorkflow(role, "email-priority")
        |
        +--> sendEventToUser(tenantId, "new_email")  --SSE-->  live toast in dashboard
        |
        +--> inngest.send("email/received")  ----------------> Gemini assigns a
                                                                 priority label
```

`GET /sse/stream` is the long-lived channel the dashboard keeps open (with a 25s heartbeat) to receive `new_email`, `agent_started`, `agent_step`, and `agent_done` events as they happen.

## Data model

```
users -----------1:1----------- user_settings
  |   id, name, email, role        geminiApiKey, preferredModel,
  |   plugins{gmail,calendar}      approvalsRequired, keybinds
  |
  | tenantId = users.id
  v
corsair_accounts ------------ corsair_integrations
       |                          (gmail, googlecalendar plugin config)
       |
       +----< corsair_entities    synced Gmail messages / Calendar events
       |
       +----< corsair_events      webhook event log
```

Every credential and synced payload that touches Corsair's tables is encrypted with a per-record DEK under your `CORSAIR_KEK`.

## Environment variables

```
PORT                       port the Express server listens on
DATABASE_URL               Postgres connection string
JWT_SECRET                 signs short-lived access tokens
REFRESH_SECRET             signs long-lived refresh tokens
CORSAIR_KEK                key-encryption-key for Corsair's stored secrets
GOOGLE_CLIENT_ID            Google OAuth client id
API_URL                     this API's own public URL (OAuth callback, MCP base)
FRONTEND_URL                dashboard origin, used for CORS + post-auth redirect
GCP_PUBSUB_SA_KEY            service-account JSON for Pub/Sub token minting
GMAIL_PUBSUB_TOPIC           Pub/Sub topic Gmail publishes change notifications to
RAZORPAY_KEY_ID              Razorpay public key
RAZORPAY_KEY_SECRET          Razorpay secret key + webhook signature check
```

## Scripts

```
npm run dev        tsc-watch + auto-restart on change
npm run build       compile TypeScript to dist/
npm start            run the compiled server
npm run db:gen       generate a drizzle migration from schema.ts
npm run db:mig       apply pending migrations
npm run db:push      push schema straight to the database (dev convenience)
npm test              run the full fetch-based integration suite
```

## Testing

```
tests/
|-- auth.test.ts            register, login, Google auth, refresh, me, logout
|-- gmail.test.ts            messages, threads, drafts, labels, workflows
|-- calendar.test.ts         events CRUD + availability
|-- ai.test.ts                prompt happy-path + rate-limit paths
|-- command-center.test.ts    overview aggregation
|-- settings.test.ts          get/patch settings
|-- razorpay.test.ts          order creation + payment verification
|-- webhooks.test.ts          health, pubsub ingestion, duplicate suppression
`-- runner.ts                  shared test/assert/json helpers, no framework needed
```

Start the server, export a `TEST_TOKEN` from a logged-in user, then run `npx tsx tests/index.ts` for the full suite or target any single file directly.
