# SayDo

AI-powered Gmail & Calendar assistant on Corsair — async Inngest workflows, dual Gemini/Ollama models, MCP tool chat, settings-aware prompts.

Built on the [Corsair](https://corsair.dev) platform (Gmail + Google Calendar plugin integrations). Backend is Express 5 + TypeScript, frontend is Next.js 16 + React 19.

---

## 1. Stack

```
┌─────────────────────────────┐       ┌──────────────────────────────┐
│           FRONTEND           │       │            BACKEND            │
│   Next.js 16 (App Router)    │ HTTP  │     Express 5 + TypeScript    │
│   React 19, Tailwind v4      │──────▶│   Drizzle ORM + Postgres      │
│   gsap, lenis (animations)   │◀──────│   Inngest (job queue)         │
└─────────────────────────────┘  SSE  └──────────────────────────────┘
                                              │           │
                                              ▼           ▼
                                       ┌────────────┐ ┌──────────┐
                                       │  Corsair    │ │  Gemini /│
                                       │  (Gmail +   │ │  Ollama  │
                                       │  Calendar)  │ │  (AI)    │
                                       └────────────┘ └──────────┘
```

---

## 2. High-level architecture

```
                              ┌───────────────────┐
                              │      Browser        │
                              │  (Next.js client)   │
                              └──────────┬───────────┘
                                         │ fetch (Bearer JWT + cookie)
                                         ▼
┌───────────────────────────────────────────────────────────────────────┐
│                           Express app.ts                              │
│                                                                         │
│  /auth ───────────────► auth module (register/login/google/refresh)   │
│  /ai   ──auth─►settings─►rateLimit──► corsair_ai (chat + tools)        │
│  /gmail ──auth──────────► gmail module                                │
│  /calendar ──auth───────► googlecalendar module                       │
│  /settings ──auth────────► settings module                            │
│  /sse ────────────────────► sse module (live push to client)          │
│  /api/payments ──auth────► razorpay module                            │
│  /mcp ──auth──────────────► per-tenant MCP server (tool exposure)     │
│  /webhooks ────────────────► webhooks module (Corsair push events)    │
│  /api/inngest ──────────────► inngest function registry               │
└───────────────────────────────────────────────────────────────────────┘
```

Every domain route lives in `backend/src/modules/<name>/` following the same internal shape:

```
modules/<name>/
   ├── <name>.routes.ts        registers Express endpoints
   ├── <name>.controller.ts    parses req, calls service, shapes res
   ├── <name>.services.ts      business logic, talks to Corsair/DB/AI
   └── <name>.modal.ts         zod schemas + inferred types
```

---

## 3. Request flow — AI chat (the main feature)

```
 User types "summarize my unread emails"
        │
        ▼
 ChatSection.tsx ── builds history[] from PRIOR messages (not current one)
        │
        ▼
 POST /ai/prompt   { prompt, useLocalModal, options:{ history } }
        │
        ▼
 ┌─────────────┐   ┌───────────────────┐   ┌────────────────────┐
 │ authMiddleware │─▶│ injectUserSettings │─▶│   aiRateLimiter     │
 └─────────────┘   └───────────────────┘   └────────────────────┘
        │
        ▼
 promptAI (controller)
   - checks prompt limit vs role (PROMPT_LIMITS)
   - calls sendAIPrompt(...)
        │
        ▼
 sendAIPrompt (service)
   1. spin up MCP client → mcpClient.tools()
   2. resolveAiModel(settings) → Gemini Flash or Ollama (gemma4)
   3. sanitizeHistory → filterHistoryByPlan(role) → buildMessagesFromHistory
   4. generateText({ model, tools, system, messages })  ⟵ AI SDK
        │
        ▼
   model decides: answer directly  OR  call a Corsair tool
        │                                   │
        ▼                                   ▼
   plain text reply               list_operations → get_schema → run_script
        │                                   │
        └───────────────┬───────────────────┘
                         ▼
                  { success: true, message }
                         │
                         ▼
                 rendered in ChatMessage bubble
```

### Why history matters here

```
 messages[]  =  [ {user: "hi"}, {assistant: "hello"}, {user: "what's my last msg?"} ]
                                                              ▲
                                                  history sent = messages BEFORE this one
                                                  current prompt appended ONCE on backend
```

(Earlier bug: frontend sent history including the current prompt, then backend appended it again → duplicate last turn → model echoed the question back as "your last message." Fixed by building `history` from `messages`, not `updatedMessages`.)

---

## 4. Tool calling sequence (system prompt contract)

The AI is instructed to follow a strict step order before touching any Corsair tool:

```
 Step 0 ── tool needed? ──no──► reply directly, STOP
              │yes
              ▼
 Step 1 ── list_operations          (discover what's callable)
              ▼
 Step 2 ── get_schema(operation)    (learn the shape)
              ▼
 Step 3 ── run_script(operation)    (execute, get data)
              ▼
 Step 4 ── format final answer (markdown, never HTML)
              ▼
 Step 5 ── prefer cached DB read over live API call when possible
```

If `settings.approvalsRequired` is on, a step 6 is injected: confirm destructive actions (create/update/delete) with the user before running them.

---

## 5. Async workflows (Inngest)

Heavier jobs don't block the request/response cycle — they're fired as Inngest events and processed in the background, then pushed to the client over SSE.

```
 Gmail webhook (Corsair) ──► POST /webhooks
        │
        ▼
 new message detected?  ──no──► 200 ack, done
        │ yes
        ▼
 inngest.send("email/received")  +  sendEventToUser(SSE: "new_email")
        │
        ▼
 ┌───────────────────────────────────────────────────────────┐
 │                  Inngest function registry                  │
 │                                                                │
 │  onEmailReceivedAssignPriority      onWeeklyDigestRequested    │
 │  onDailyDigestRequested             onUnsubscribeSuggestions   │
 │  onFollowupScanRequested            onBulkCleanupRequested     │
 │  onWeekPrepBriefingRequested        onConflictDetectionRequested│
 └───────────────────────────────────────────────────────────┘
        │
        ▼
 writes back to corsair_entities / labels  ──►  SSE push  ──►  client toast/update
```

Each workflow can also be triggered manually from the UI:
`POST /gmail/workflows/:workflowId/run`

---

## 6. Auth flow

```
            ┌─────────────┐
   local ──▶│ /auth/login  │──┐
            └─────────────┘  │
            ┌─────────────┐  │      ┌───────────────┐      ┌─────────────┐
  google ──▶│ /auth/google │──┼─────▶│ JWT (access)   │─────▶│  httpOnly    │
            └─────────────┘  │      │ + refresh token │      │  cookie set  │
                              │      └───────────────┘      └─────────────┘
                              │
            every protected route
                              │
                              ▼
                     authMiddleware
                  (verifies Bearer / cookie)
                              │
                              ▼
                   req.user, req.userRole set
```

Connecting Gmail/Calendar plugins is a separate OAuth hop:

```
 /auth/connect-link?pluginId=gmail ──► Corsair-hosted OAuth ──► /auth/callback
                                                                       │
                                                                       ▼
                                                     corsair_integrations row written
```

---

## 7. Data model (Postgres via Drizzle)

```
 users ─────┬──< userSettings        (1:1 — model prefs, API key, keybinds)
            │
            ├──< corsairIntegrations (which plugins connected)
            │
            └──< corsairAccounts ──< corsairEntities   (emails, drafts, labels, events — generic envelope)
                                  └─< corsairEvents     (raw webhook event log)
```

`corsairEntities` is a generic JSONB-backed table — Gmail messages, drafts, and labels (and calendar events) all live here as rows with an `entity_type` discriminator, not separate tables per type.

---

## 8. Model resolution

```
        useLocalModel?
         /         \
       yes           no
        │             │
        ▼             ▼
  ollama("gemma4")   has settings.geminiApiKey?
  (local, free,       /              \
   no API key)       yes              no
                       │                │
                       ▼                ▼
              custom Gemini key   shared Gemini key
              (user's own quota)  (gemini-flash-lite-latest,
                                   counted against PROMPT_LIMITS)
```

---

## 9. Frontend route map

```
 /                       marketing landing
 /pricing /privacy /tos  static pages
 /auth                   login/register/google
 /profile                account settings
 /dashboard
   ├── /                 chat (ChatSection — main AI surface)
   ├── /connect           plugin connect screen
   ├── /settings          model/keybind/approval prefs
   ├── /gmail
   │     ├── /inbox /sent /drafts /spam /trash /starred /important /all
   │     ├── /labels  /labels/[labelId]
   │     ├── /message/[id]
   │     └── /compose
   └── /calendar
         ├── /            calendar view
         └── /workflows    calendar-specific automations
```

---

## 10. Folder map (top level)

```
Corsair_Hackathon/
├── backend/
│   ├── index.ts                entrypoint, just listens
│   ├── src/
│   │   ├── app.ts               all route + middleware wiring
│   │   ├── corsair.ts           Corsair SDK client init
│   │   ├── db/                  drizzle schema + connection
│   │   ├── common/               shared middleware, utils, config
│   │   └── modules/
│   │       ├── auth/
│   │       ├── corsair_ai/      ← chat + tool-calling
│   │       ├── gmail/
│   │       ├── googlecalendar/
│   │       ├── inngest/         ← async workflow functions
│   │       ├── razorpay/
│   │       ├── settings/
│   │       ├── sse/
│   │       └── webhooks/
│   └── drizzle.config.ts
│
└── frontend/
    └── src/
        ├── app/                 Next.js App Router pages
        ├── components/          ChatSection, GmailUI, Sidebar, etc.
        ├── hooks/gmail/          useMessages, useDrafts, useLabels, useAiPrompt
        ├── lib/                  api.ts, tokenStore.ts, keybinds.ts
        └── context/
```

---

## 11. Running locally

```
backend:
  npm install
  npm run db:push      # push drizzle schema to Postgres
  npm run dev           # tsc-watch + node dist/index.js → localhost:3000

frontend:
  npm install
  npm run dev           # next dev → localhost:3000 (default Next port, set NEXT_PUBLIC_API_URL)
```

Required env essentials: Postgres connection string, Corsair API credentials, Gemini API key (or run fully local via Ollama), Inngest keys, Razorpay keys (if payments enabled).
