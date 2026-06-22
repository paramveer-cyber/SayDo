import { Router, type Request, type Response } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { findUserByEmail } from "../auth/auth.queries.js";
import type { WebhookProcessedResult } from "./webhooks.types.js";

const webhooksRouter = Router();

const decodeEmailFromPubSubPayload = (
  body: Record<string, unknown>,
): string | null => {
  try {
    const messageData = (body.message as Record<string, unknown> | undefined)
      ?.data;
    if (typeof messageData !== "string") return null;
    const decoded = JSON.parse(
      Buffer.from(messageData, "base64").toString("utf-8"),
    ) as Record<string, unknown>;
    return typeof decoded.emailAddress === "string"
      ? decoded.emailAddress
      : null;
  } catch {
    console.warn("failed to decode Pub/Sub payload");
    return null;
  }
};

const isStaleWebhookError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Account not found") ||
    (error as { status?: unknown }).status === 404
  );
};

const isNetworkTimeout = (error: unknown): boolean => {
  if (!(error instanceof TypeError)) return false;
  const cause = (error as { cause?: { code?: string } }).cause;
  return cause?.code === "ETIMEDOUT" || cause?.code === "UND_ERR_CONNECT_TIMEOUT";
};

webhooksRouter.post("/", async (req: Request, res: Response) => {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value)) {
      headers[key] = value[0]!;
    }
  }

  const body =
    typeof req.body === "object" && req.body !== null ? req.body : {};

  const emailFromPayload = decodeEmailFromPubSubPayload(body);

  let resolvedTenantId: string | undefined;

  if (emailFromPayload) {
    const user = await findUserByEmail(emailFromPayload);
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "Unknown tenant email" });
    }
    resolvedTenantId = user.id;
  } else {
    resolvedTenantId = req.query.tenant as string | undefined;
  }

  let result: WebhookProcessedResult;
  try {
    result = (await processWebhook(corsair, headers, body, {
      ...(resolvedTenantId && { tenantId: resolvedTenantId }),
    })) as WebhookProcessedResult;
  } catch (webhookError) {
    if (isNetworkTimeout(webhookError)) {
      console.warn("webhook skipped: Render egress blocked to Google APIs");
    } else if (isStaleWebhookError(webhookError)) {
      console.warn("webhook skipped (stale):", (webhookError as Error).message);
    } else {
      console.error("webhook processing failed:", webhookError);
    }
    return res
      .status(200)
      .json({ success: false, message: "Webhook processing failed" });
  }

  if (result.responseHeaders) {
    for (const [key, value] of Object.entries(result.responseHeaders)) {
      res.setHeader(key, value);
    }
  }

  return res
    .status(200)
    .json(result.response ?? { success: false, message: "No handler matched" });
});

webhooksRouter.get("/", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
});

export { webhooksRouter };