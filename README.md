# SayDo

> AI-powered productivity platform that connects Gmail and Google Calendar to a Gemini-backed agent — triage your inbox, manage your schedule, and run automated workflows from a single command center.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Backend](#backend)
  - [Project Structure](#backend-project-structure)
  - [API Routes](#api-routes)
  - [Database Schema](#database-schema)
  - [Inngest Workflows](#inngest-workflows)
  - [Role-Based Access Control](#role-based-access-control)
  - [MCP Server](#mcp-server)
  - [Webhooks & Real-Time Events](#webhooks--real-time-events)
  - [Testing](#testing)
- [Frontend](#frontend)
  - [Project Structure](#frontend-project-structure)
  - [Pages & Features](#pages--features)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Auth Flow](#auth-flow)
- [Pricing Tiers](#pricing-tiers)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                    │
│  Landing · Auth · Dashboard · Gmail · Calendar · Chat       │
└────────────────────────┬─────────────────────┬──────────────┘
                         │ REST + SSE           │ Razorpay JS
                         ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend (Node)                     │
│                                                             │
│  /auth   /ai   /gmail   /calendar   /settings              │
│  /command-center   /sse   /mcp   /api/payments             │
│  /webhooks   /api/inngest                                   │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │   Corsair    │  │    Inngest    │  │   Gemini (AI)   │  │
│  │ (Gmail +     │  │  (background  │  │  via AI SDK +   │  │
│  │  Calendar    │  │   workflows)  │  │  MCP server     │  │
│  │  OAuth +     │  └───────────────┘  └─────────────────┘  │
│  │  data sync)  │                                          │
│  └──────────────┘                                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Neon PostgreSQL (via Drizzle ORM)          │  │
│  │  users · user_settings · corsair_* tables            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          ▲ Google Pub/Sub webhook
          │ (new email notifications)
```

Key design decisions:

- **Corsair** handles all Google OAuth token management, credential encryption (KEK/DEK), multi-tenancy, and syncing raw Gmail/Calendar data into Postgres.
- **Inngest** runs background AI workflows (digests, priority tagging, cleanup) as reliable durable functions with built-in retries.
- **MCP** (Model Context Protocol) exposes Corsair-synced data as tools the Gemini agent can call at runtime.
- **SSE** pushes real-time events (new emails, workflow completions) from server to browser without polling.

---

## Monorepo Structure

```
saydo/
├── frontend/   # Next.js 16 App Router
└── backend/    # Express 5 + TypeScript
```

---

## Tech Stack

|                         | Frontend                                          | Backend                                                       |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| **Language**            | TypeScript 5                                      | TypeScript 6                                                  |
| **Framework**           | Next.js 16 (App Router)                           | Express 5                                                     |
| **Database**            | —                                                 | PostgreSQL via Drizzle ORM                                    |
| **Auth**                | JWT Bearer + Google OAuth (`@react-oauth/google`) | `jsonwebtoken` + `google-auth-library` + `bcryptjs`           |
| **AI**                  | —                                                 | Vercel AI SDK (`ai`) + `@ai-sdk/google` (Gemini)              |
| **Agent tools**         | —                                                 | `@ai-sdk/mcp` + Corsair MCP server                            |
| **Background jobs**     | —                                                 | Inngest                                                       |
| **Google integrations** | —                                                 | Corsair (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`) |
| **Payments**            | Razorpay JS                                       | `razorpay` SDK                                                |
| **Styling**             | Tailwind CSS v4                                   | —                                                             |
| **Animation**           | GSAP 3 + Lenis                                    | —                                                             |
| **Markdown**            | `react-markdown` + `remark-gfm`                   | —                                                             |
| **Validation**          | —                                                 | Zod 4                                                         |
| **Security**            | —                                                 | Helmet, CORS, rate limiting (`express-rate-limit`)            |
| **Real-time**           | SSE listener component                            | SSE service + Google Pub/Sub                                  |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (e.g. Neon)
- Google Cloud project with Gmail and Calendar APIs enabled, and an OAuth 2.0 client configured
- Inngest account (or local dev server)
- Razorpay account
- Gemini API key

### 1. Clone & install

```bash
git clone <repo-url>
cd saydo

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

See the [Environment Variables](#environment-variables) section for both apps.

### 3. Run database migrations

```bash
cd backend
npm run db:push   # push schema directly (dev)
# or
npm run db:gen    # generate migration files
npm run db:mig    # apply migrations
```

### 4. Start development servers

```bash
# Terminal 1 — backend (auto-recompiles on save)
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Backend runs on `http://localhost:3000` · Frontend runs on `http://localhost:3001` (or the next available port).

---

## Environment Variables

### Backend — `.env`

```env
# Server
PORT=3000
FRONTEND_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@host/dbname

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Corsair
CORSAIR_KEK=your_32_byte_key_encryption_key

# Google Pub/Sub (for Gmail push notifications)
GCP_PUBSUB_SA_KEY={"type":"service_account",...}

# AI
GEMINI_API_KEY=your_gemini_api_key

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Frontend — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Backend

### Backend Project Structure

```
backend/
├── index.ts                        # Entry point — starts Express server
├── drizzle.config.ts               # Drizzle ORM config
├── src/
│   ├── app.ts                      # Express app setup (middleware, routes)
│   ├── corsair.ts                  # Corsair instance (Gmail + Calendar plugins)
│   ├── db/
│   │   ├── index.ts                # DB connection pool
│   │   └── schema.ts               # Drizzle table definitions
│   ├── common/
│   │   ├── config/
│   │   │   ├── cookie-opts.ts      # Refresh token cookie settings
│   │   │   ├── inngest.client.ts   # Inngest client
│   │   │   └── pubsub.client.ts    # Google Pub/Sub auth helper
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts # Global error handler
│   │   │   ├── rateLimiter.ts      # Auth + AI rate limiters
│   │   │   └── validate.ts         # Zod body/query validation middleware
│   │   └── utils/
│   │       ├── aiProvider.ts       # Resolve Gemini model (user key or default)
│   │       ├── api-error.ts        # ApiError class
│   │       ├── chatHistory.ts      # Chat history helpers
│   │       ├── corsair-error.ts    # Corsair error normalizer
│   │       ├── corsair-tenant.ts   # Per-tenant Corsair instance cache
│   │       ├── rbac.ts             # Role ranks, prompt limits, workflow gates
│   │       ├── response.ts         # ok/created response helpers
│   │       └── tokenLogic.ts       # JWT generate/verify helpers
│   ├── modules/
│   │   ├── auth/                   # Register, login, Google OAuth, refresh, plugins
│   │   ├── corsair_ai/             # /ai/prompt endpoint (Gemini + MCP)
│   │   ├── gmail/                  # Messages, threads, drafts, labels, workflows
│   │   ├── googlecalendar/         # Events CRUD + availability
│   │   ├── command-center/         # Dashboard summary endpoint
│   │   ├── inngest/
│   │   │   ├── email.functions.ts  # All Inngest workflow functions
│   │   │   ├── system.prompts.ts   # System prompts for each AI workflow
│   │   │   └── inngest.types.ts    # Shared Inngest types
│   │   ├── razorpay/               # Order creation + payment verification
│   │   ├── settings/               # User settings CRUD
│   │   ├── sse/                    # Server-Sent Events service + routes
│   │   └── webhooks/               # Google Pub/Sub webhook ingestion
│   └── types/
│       └── types.d.ts              # Express Request augmentation (req.user)
└── tests/                          # Integration test suites (no framework)
```

### API Routes

All routes except `/health`, `/auth/*`, and `/webhooks` require a `Authorization: Bearer <token>` header.

| Method | Path                               | Auth   | Description                                                    |
| ------ | ---------------------------------- | ------ | -------------------------------------------------------------- |
| GET    | `/health`                          | —      | Health check                                                   |
| POST   | `/auth/register`                   | —      | Create account (email/password)                                |
| POST   | `/auth/login`                      | —      | Login, returns JWT + sets refresh cookie                       |
| POST   | `/auth/google`                     | —      | Login with Google ID token                                     |
| POST   | `/auth/refresh`                    | cookie | Rotate refresh token, return new access token                  |
| POST   | `/auth/logout`                     | cookie | Clear refresh token                                            |
| GET    | `/auth/me`                         | ✓      | Get current user                                               |
| GET    | `/auth/connect-link`               | ✓      | Get OAuth URL for a plugin (`?pluginId=gmail\|googlecalendar`) |
| GET    | `/auth/callback`                   | —      | OAuth callback — processes code & connects plugin              |
| DELETE | `/auth/account`                    | ✓      | Delete account + all data                                      |
| DELETE | `/auth/plugins/:pluginId`          | ✓      | Disconnect a plugin                                            |
| POST   | `/ai/prompt`                       | ✓      | Send a prompt to Gemini agent (rate-limited by role)           |
| GET    | `/gmail/messages`                  | ✓      | List messages (filterable by label, pageToken)                 |
| POST   | `/gmail/messages/sync`             | ✓      | Trigger full Gmail sync                                        |
| POST   | `/gmail/messages/send`             | ✓      | Send a new email                                               |
| GET    | `/gmail/messages/:id`              | ✓      | Get single message                                             |
| PATCH  | `/gmail/messages/:id`              | ✓      | Modify labels on a message                                     |
| DELETE | `/gmail/messages/:id`              | ✓      | Permanently delete a message                                   |
| POST   | `/gmail/messages/:id/trash`        | ✓      | Move to trash                                                  |
| POST   | `/gmail/messages/batch-modify`     | ✓      | Batch label modification                                       |
| GET    | `/gmail/threads`                   | ✓      | List threads                                                   |
| GET    | `/gmail/threads/:id`               | ✓      | Get thread                                                     |
| PATCH  | `/gmail/threads/:id`               | ✓      | Modify thread                                                  |
| POST   | `/gmail/threads/:id/trash`         | ✓      | Trash thread                                                   |
| GET    | `/gmail/drafts`                    | ✓      | List drafts                                                    |
| POST   | `/gmail/drafts`                    | ✓      | Create draft                                                   |
| PUT    | `/gmail/drafts/:id`                | ✓      | Update draft                                                   |
| DELETE | `/gmail/drafts/:id`                | ✓      | Delete draft                                                   |
| POST   | `/gmail/drafts/:id/send`           | ✓      | Send draft                                                     |
| GET    | `/gmail/labels`                    | ✓      | List labels                                                    |
| POST   | `/gmail/labels`                    | ✓      | Create label                                                   |
| PATCH  | `/gmail/labels/:id`                | ✓      | Update label                                                   |
| DELETE | `/gmail/labels/:id`                | ✓      | Delete label                                                   |
| POST   | `/gmail/workflows/:workflowId/run` | ✓      | Trigger an Inngest workflow                                    |
| GET    | `/calendar/events`                 | ✓      | List calendar events                                           |
| GET    | `/calendar/events/:id`             | ✓      | Get event                                                      |
| POST   | `/calendar/events`                 | ✓      | Create event                                                   |
| PATCH  | `/calendar/events/:id`             | ✓      | Update event                                                   |
| DELETE | `/calendar/events/:id`             | ✓      | Delete event                                                   |
| POST   | `/calendar/availability`           | ✓      | Check availability for a time range                            |
| GET    | `/command-center`                  | ✓      | Fetch dashboard summary                                        |
| GET    | `/settings`                        | ✓      | Get user settings                                              |
| PATCH  | `/settings`                        | ✓      | Update settings                                                |
| GET    | `/sse`                             | ✓      | Open SSE stream for real-time events                           |
| POST   | `/api/payments/order`              | ✓      | Create Razorpay order                                          |
| POST   | `/api/payments/verify`             | ✓      | Verify payment signature + upgrade role                        |
| POST   | `/webhooks`                        | —      | Google Pub/Sub push webhook                                    |
| POST   | `/api/inngest`                     | —      | Inngest function runner                                        |
| ALL    | `/mcp`                             | ✓      | Tenant-scoped MCP server for AI tool calls                     |

### Database Schema

Five tables managed by Drizzle ORM:

**`users`** — core user record with bcrypt password hash (local auth), Google provider ID, hashed refresh token, role, and a `plugins` JSONB map tracking which OAuth integrations are connected.

**`user_settings`** — one-to-one with users; stores Gemini API key, preferred model, approvals flag, daily prompt counter, custom system prompt, and remapped keybinds.

**`corsair_integrations`** — integration definitions managed by Corsair (Gmail, Google Calendar). Encrypted config stored with a data-encryption key (DEK).

**`corsair_accounts`** — per-user, per-integration OAuth credentials. Each row is scoped to a `tenant_id` (the user's UUID).

**`corsair_entities`** — synced data objects (emails, calendar events) stored as versioned JSONB rows.

**`corsair_events`** — webhook events received from Google Pub/Sub, processed by Corsair before being dispatched to Inngest.

### Inngest Workflows

Background AI workflows are Inngest durable functions with automatic retries. Each checks RBAC before running.

| Function                            | Trigger Event                   | Min Role            | Description                                                      |
| ----------------------------------- | ------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `onEmailReceivedAssignPriority`     | `email/received`                | `user`              | Labels incoming emails High / Medium / Low priority using Gemini |
| `onWeeklyDigestRequested`           | `email/weekly-digest`           | `bronze_subscriber` | Generates a weekly email digest                                  |
| `onDailyDigestRequested`            | `email/daily-digest`            | `silver_subscriber` | Generates a daily email digest                                   |
| `onUnsubscribeSuggestionsRequested` | `email/unsubscribe-suggestions` | `silver_subscriber` | Identifies newsletters/promos to unsubscribe from                |
| `onFollowupScanRequested`           | `email/followup-scan`           | `silver_subscriber` | Finds emails that need a reply                                   |
| `onBulkCleanupRequested`            | `email/bulk-cleanup`            | `gold_subscriber`   | Bulk-archives or deletes low-value mail                          |
| `onWeekPrepBriefingRequested`       | `calendar/week-prep`            | `bronze_subscriber` | Generates a week-ahead calendar briefing                         |
| `onConflictDetectionRequested`      | `calendar/conflict-detection`   | `silver_subscriber` | Detects and flags scheduling conflicts                           |
| `onBulkPrioritizeWeekRequested`     | `calendar/bulk-prioritize`      | `bronze_subscriber` | Batch-prioritizes the week's calendar events                     |

### Role-Based Access Control

Five roles with a strict rank order:

```
user (0) < bronze_subscriber (1) < silver_subscriber (2) < gold_subscriber (3) < admin (∞)
```

**Daily prompt limits** (bypassed if the user provides their own Gemini API key):

| Role                | Prompts/day |
| ------------------- | ----------- |
| `user`              | 5           |
| `bronze_subscriber` | 50          |
| `silver_subscriber` | 200         |
| `gold_subscriber`   | 1,000       |
| `admin`             | unlimited   |

### MCP Server

The `/mcp` endpoint creates a per-tenant Model Context Protocol server backed by Corsair. When the Gemini agent handles a prompt it calls tools on this MCP server to read synced Gmail and Calendar data from Postgres — no live Google API calls at inference time.

### Webhooks & Real-Time Events

1. Google sends Gmail push notifications to `/webhooks` via Google Pub/Sub.
2. Corsair's `processWebhook` parses and validates the payload, then syncs the new message into the `corsair_entities` table.
3. The webhook handler fires an `email/received` Inngest event (triggering the priority classifier) and pushes a real-time notification to the user's open SSE connection via `sendEventToUser`.
4. The frontend's `SSEListener` component receives the event and updates the inbox without a page reload.

### Testing

Integration tests run against a live server using native `fetch` — no test framework required.

```bash
# Start the server first
npm run dev

# Run all test suites
npm test
# or
npx tsx tests/index.ts

# Run a single suite
npx tsx tests/auth.test.ts
npx tsx tests/gmail.test.ts
npx tsx tests/calendar.test.ts
npx tsx tests/ai.test.ts
npx tsx tests/webhooks.test.ts
npx tsx tests/razorpay.test.ts
npx tsx tests/command-center.test.ts
npx tsx tests/settings.test.ts
```

Tests that require Gmail/Calendar/AI access need a valid JWT:

```bash
export TEST_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' \
  | jq -r '.data.token')
```

---

## Frontend

### Frontend Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── auth/                   # Login / register page
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Command Center
│   │   │   ├── chat/               # AI chat view
│   │   │   ├── gmail/              # Gmail views + workflows
│   │   │   ├── calendar/           # Calendar view + workflows
│   │   │   ├── connect/            # OAuth plugin connection
│   │   │   └── settings/           # User & keybind settings
│   │   ├── pricing/                # Pricing page (Razorpay checkout)
│   │   ├── profile/                # User profile
│   │   ├── privacy/                # Privacy policy
│   │   ├── tos/                    # Terms of service
│   │   ├── layout.tsx              # Root layout (providers, theme script)
│   │   └── globals.css             # Global styles + CSS variables
│   ├── components/                 # UI components (Sidebar, Chat, Gmail, Calendar, …)
│   ├── context/
│   │   ├── AuthContext.tsx         # JWT auth state + refresh logic
│   │   └── ToastContext.tsx        # Global toasts
│   ├── hooks/                      # useMessages, useDrafts, useLabels, useTheme
│   ├── lib/
│   │   ├── api.ts                  # Typed API client
│   │   ├── keybinds.ts             # Keybind registry + defaults
│   │   ├── plugins.ts              # Required plugin check
│   │   └── tokenStore.ts           # In-memory JWT store
│   └── types/
│       └── razorpay.d.ts
└── package.json
```

### Pages & Features

**Landing page (`/`)** — animated hero with GSAP scroll effects and Lenis smooth scroll.

**Auth (`/auth`)** — combined register / login form with Google One Tap sign-in.

**Connect (`/dashboard/connect`)** — OAuth plugin connection flow. New users are redirected here until both Gmail and Google Calendar are authorized. Status updates in real time after each OAuth callback.

**Command Center (`/dashboard`)** — main dashboard view. Requires both plugins connected. Renders the `CommandCenterSection` component with a dot-grid background and GSAP fade-in.

**AI Chat (`/dashboard/chat`)** — conversational interface powered by the Gemini agent. Supports multi-turn history, streaming via SSE, and shows an animated step-by-step indicator while the agent is working.

**Gmail (`/dashboard/gmail/...`)** — full Gmail client with dedicated routes for inbox, sent, drafts, starred, spam, trash, important, and dynamic label views. Includes a message thread viewer, compose window, AI bar for prompt-driven actions, and a Workflows page for triggering Inngest jobs.

**Calendar (`/dashboard/calendar`)** — Google Calendar view with event management and a Workflows page for calendar automations.

**Settings (`/dashboard/settings`)** — preferred model, BYO Gemini API key, approval mode toggle, custom system prompt, and a fully remappable keybinds editor.

**Pricing (`/pricing`)** — four-tier pricing page with Razorpay checkout integration.

### Keyboard Shortcuts

All shortcuts are remappable from Settings → Keybinds.

| Action                    | Default            |
| ------------------------- | ------------------ |
| Toggle light / dark theme | `Ctrl + Shift + L` |
| Go to Command Center      | `Ctrl + 0`         |
| Go to Chat                | `Ctrl + 1`         |
| Go to Gmail               | `Ctrl + 2`         |
| Go to Calendar            | `Ctrl + 3`         |

---

## Auth Flow

```
User                    Frontend                   Backend
 │                          │                          │
 │── enter credentials ───► │                          │
 │                          │── POST /auth/login ────► │
 │                          │                          │── verify bcrypt
 │                          │                          │── generate access token (JWT)
 │                          │                          │── generate refresh token
 │                          │                          │── store hashed refresh token
 │                          │◄── { token, user } ─────│
 │                          │    + Set-Cookie: refreshToken (httpOnly)
 │                          │── store token in memory  │
 │                          │                          │
 │                     [token expires]                 │
 │                          │── POST /auth/refresh ──► │ (sends cookie)
 │                          │                          │── verify + rotate refresh token
 │                          │◄── { token, user } ──── │
 │                          │                          │
 │── connect Gmail ────────► │                          │
 │                          │── GET /auth/connect-link │
 │                          │◄── { url } ─────────────│
 │◄── redirect to Google ── │                          │
 │── authorize scopes ─────────────────────────────── │
 │                          │◄── GET /auth/callback ── Google
 │                          │                          │── Corsair stores OAuth tokens
 │                          │                          │── sets plugins.gmail = true
 │                          │◄── redirect to /dashboard/connect?connected=true
```

Token storage: access tokens are kept **in memory only** (`tokenStore.ts`) — never in `localStorage` or cookies — to minimize XSS exposure. The refresh token lives in an `httpOnly`, `SameSite=Strict` cookie.

---

## Pricing Tiers

Subscriptions are managed via Razorpay. On successful payment the backend verifies the signature and upgrades the user's role.

| Tier   | Price     | Prompts/day (server) | Workflows unlocked                                                         |
| ------ | --------- | -------------------- | -------------------------------------------------------------------------- |
| Free   | ₹0        | 5                    | Email priority tagging                                                     |
| Bronze | ₹399/mo   | 50                   | + Weekly digest, week prep, bulk prioritize                                |
| Silver | ₹999/mo   | 200                  | + Daily digest, unsubscribe suggestions, followup scan, conflict detection |
| Gold   | ₹1,999/mo | 1,000                | + Bulk cleanup                                                             |

> Users who supply their own Gemini API key bypass the daily prompt limit entirely, regardless of tier.
