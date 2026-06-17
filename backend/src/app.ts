import "dotenv/config";
import express from "express";
import cors from "cors";
import { serve } from "inngest/express";
import { createBaseMcpServer, createMcpRouter } from "@corsair-dev/mcp";
import { corsair } from "./corsair.js";
import { inngest } from "./common/config/inngest.client.js";
import {
  onEmailReceivedAssignPriority,
  onWeeklyDigestRequested,
  onDailyDigestRequested,
  onUnsubscribeSuggestionsRequested,
  onFollowupScanRequested,
  onBulkCleanupRequested,
  onWeekPrepBriefingRequested,
  onConflictDetectionRequested,
} from "./modules/inngest/email.functions.js";
import { aiCorsairRouter } from "./modules/corsair_ai/corsair.routes.js";
import { gmailRouter } from "./modules/gmail/gmail.routes.js";
import { googleCalendarRouter } from "./modules/googlecalendar/googlecalendar.routes.js";
import { webhooksRouter } from "./modules/webhooks/webhooks.routes.js";
import errorHandler from "./common/middleware/error.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { authMiddleware } from "./modules/auth/auth.middleware.js";
import { aiRateLimiter } from "./common/middleware/rateLimiter.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { injectUserSettings } from "./modules/settings/settings.middleware.js";
import { sseRouter } from "./modules/sse/sse.routes.js";
import { razorpayRouter } from "./modules/razorpay/razorpay.routes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [
      onEmailReceivedAssignPriority,
      onWeeklyDigestRequested,
      onDailyDigestRequested,
      onUnsubscribeSuggestionsRequested,
      onFollowupScanRequested,
      onBulkCleanupRequested,
      onWeekPrepBriefingRequested,
      onConflictDetectionRequested,
    ],
  }),
);
app.use("/webhooks", webhooksRouter);
app.use("/auth", authRouter);
app.use(
  "/ai",
  authMiddleware,
  injectUserSettings,
  aiRateLimiter,
  aiCorsairRouter,
);
app.use("/gmail", authMiddleware, gmailRouter);
app.use("/calendar", authMiddleware, googleCalendarRouter);
app.use("/settings", authMiddleware, settingsRouter);
app.use("/sse", sseRouter);
app.use("/api/payments", authMiddleware, razorpayRouter);

app.use("/mcp", authMiddleware, (req, res, next) => {
  const tenantId = req.user as string;
  return createMcpRouter(() =>
    createBaseMcpServer({ corsair: corsair.withTenant(tenantId) }),
  )(req, res, next);
});

app.use((_req, res) => res.status(404).json({ message: "Route not found!" }));
app.use(errorHandler);

export { app };
