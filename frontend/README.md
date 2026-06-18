# SayDo — Frontend

> AI-powered productivity dashboard built with Next.js 16 App Router. Connects Gmail and Google Calendar to a Gemini-backed agent so you can manage your inbox, schedule, and workflows from a single command center.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Pricing Tiers](#pricing-tiers)
- [Auth Flow](#auth-flow)

---

## Overview

SayDo is a full-stack AI assistant that plugs into your Google account. After connecting Gmail and Google Calendar, users interact with a command center that surfaces an AI chat, inbox management, calendar views, automated workflows, and more — all behind a keyboard-first interface.

---

## Tech Stack

| Layer     | Technology                                                  |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 16.2 (App Router)                                   |
| Language  | TypeScript 5                                                |
| Styling   | Tailwind CSS v4                                             |
| Animation | GSAP 3 + Lenis (smooth scroll)                              |
| Auth      | JWT (Bearer token) + Google OAuth via `@react-oauth/google` |
| Payments  | Razorpay                                                    |
| AI        | Gemini (via backend MCP server)                             |
| Markdown  | `react-markdown` + `remark-gfm`                             |
| Fonts     | Geist Sans + Geist Mono (Google Fonts)                      |

---

## Project Structure

```
src/
├── app/
│   ├── auth/                   # Login / register page
│   ├── dashboard/
│   │   ├── page.tsx            # Command Center (main dashboard)
│   │   ├── chat/               # AI chat view
│   │   ├── gmail/              # Gmail views (inbox, sent, drafts, labels, …)
│   │   │   └── workflows/      # Gmail automation workflows
│   │   ├── calendar/           # Google Calendar view
│   │   │   └── workflows/      # Calendar automation workflows
│   │   ├── connect/            # OAuth plugin connection flow
│   │   └── settings/           # User & keybind settings
│   ├── pricing/                # Pricing page (Razorpay checkout)
│   ├── profile/                # User profile
│   ├── privacy/                # Privacy policy
│   ├── tos/                    # Terms of service
│   ├── layout.tsx              # Root layout (providers, fonts, theme script)
│   └── globals.css             # Global styles & CSS variables
├── components/
│   ├── CommandCenterSection    # Dashboard overview panel
│   ├── ChatSection             # AI chat with SSE streaming
│   ├── GmailSection            # Full Gmail UI component
│   ├── CalendarSection         # Calendar UI component
│   ├── Sidebar                 # App navigation sidebar
│   ├── AgentStepsIndicator     # AI step-by-step progress indicator
│   ├── GlobalKeybinds          # Global keyboard shortcut listener
│   ├── SSEListener             # Server-Sent Events handler
│   ├── NbBackdrop              # Animated noise/blur backdrop
│   ├── RazorpayCheckoutButton  # Payment button
│   └── gmail/                  # Gmail sub-components (AiBar, MessageList, …)
├── context/
│   ├── AuthContext             # Auth state (JWT + user object)
│   └── ToastContext            # Global toast notifications
├── hooks/
│   ├── gmail/                  # useMessages, useDrafts, useLabels, useAiPrompt
│   └── useTheme                # Light/dark theme toggle
├── lib/
│   ├── api.ts                  # Typed API client (auth, Gmail, calendar, AI, settings)
│   ├── keybinds.ts             # Keybind action registry & defaults
│   ├── plugins.ts              # Required plugin list & connection check
│   └── tokenStore.ts           # In-memory JWT token store
└── types/
    └── razorpay.d.ts           # Razorpay global type declarations
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running backend server (see backend repo)

### Install & run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app starts at `http://localhost:3001` by default (or whichever port Next.js picks). Set `NEXT_PUBLIC_API_URL` to point at your backend.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

| Variable                       | Description                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | Base URL of the backend REST API. Defaults to `http://localhost:3000` if unset. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID for one-tap / OAuth login.                           |

---

## Features

### Command Center

The main dashboard (`/dashboard`) is a unified view that requires both Gmail and Google Calendar to be connected. It includes a dot-grid background, GSAP fade-in animation, and renders the `CommandCenterSection` component alongside the persistent `Sidebar`.

### AI Chat

Conversational interface backed by the Gemini model via the backend MCP server. Supports streaming responses over SSE, conversation history, and an agent steps indicator that shows what the AI is doing in real time. Model and behavior can be configured in Settings.

### Gmail

Full Gmail integration with dedicated routes for:

- Inbox, Sent, Drafts, Starred, Spam, Trash, Important
- Dynamic label routes (`/dashboard/gmail/labels/[labelId]`)
- Message thread view with full body rendering
- Compose window
- AI bar for prompt-driven actions (triage, draft replies)
- **Workflows** — automated Gmail rules and digest generation

### Google Calendar

Month/week/day calendar view with event management and a dedicated **Workflows** page for calendar automations.

### Plugin Connection

New users land on `/dashboard/connect` after sign-up until both Gmail and Google Calendar OAuth scopes are granted. Connection status is tracked per-user on the backend.

### Settings

- Preferred AI model selection
- BYO Gemini API key
- Toggle approval-required mode for AI actions
- Custom system prompt override
- Fully remappable keyboard shortcuts

### Payments (Razorpay)

Subscription upgrades are handled client-side via `RazorpayCheckoutButton`, which calls the backend to create an order and opens the Razorpay checkout modal.

### Theme

Light and dark mode with persistence via `localStorage` (`saydo-theme`). A blocking inline script in `<head>` applies the saved theme before first paint to prevent flash.

---

## Keyboard Shortcuts

Shortcuts are fully remappable from Settings → Keybinds. Defaults:

| Action                  | Default Shortcut   |
| ----------------------- | ------------------ |
| Toggle light/dark theme | `Ctrl + Shift + L` |
| Go to Command Center    | `Ctrl + 0`         |
| Go to Chat              | `Ctrl + 1`         |
| Go to Gmail             | `Ctrl + 2`         |
| Go to Calendar          | `Ctrl + 3`         |

---

## Pricing Tiers

| Tier   | Price     | AI Prompts/day | Highlights                                                    |
| ------ | --------- | -------------- | ------------------------------------------------------------- |
| Free   | ₹0        | 5              | Gmail + Calendar access, inbox triage, draft replies, BYO key |
| Bronze | ₹399/mo   | 25             | + Weekly digest                                               |
| Silver | ₹999/mo   | 100            | + Daily digest, unsubscribe suggestions, calendar workflows   |
| Gold   | ₹1,999/mo | 500            | Everything in Silver                                          |

---

## Auth Flow

1. User registers or logs in at `/auth` (email/password or Google One Tap).
2. On success, the backend returns a JWT access token and sets a refresh token cookie.
3. The frontend stores the access token in `tokenStore` (in-memory) and attaches it as a `Bearer` header on every API request.
4. `AuthContext` calls `/auth/me` on load and `/auth/refresh` when the access token expires.
5. On logout, `/auth/logout` is called to clear the server-side refresh token cookie.
6. After login, users without both plugins connected are redirected to `/dashboard/connect` before they can access the dashboard.
