import { Router, type Request, type Response } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { findUserByEmail } from "../auth/auth.queries.js";
import type { WebhookProcessedResult } from "./webhooks.types.js";

const webhooksRouter = Router();

const resolveEmailFromPubSubPayload = (
  body: Record<string, unknown>,
): string | null => {
  try {
    const messageData = (body as { message?: { data?: string } }).message?.data;
    if (!messageData) return null;

    const decoded = Buffer.from(messageData, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as { emailAddress?: string };
    return parsed.emailAddress ?? null;
  } catch {
    return null;
  }
};

webhooksRouter.post("/", async (req: Request, res: Response) => {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value[0]!;
  }

  const body =
    typeof req.body === "object" && req.body !== null ? req.body : {};

  const emailFromPayload = resolveEmailFromPubSubPayload(body);
  let tenantId = req.query.tenant as string | undefined;

  if (emailFromPayload) {
    const matchedUser = await findUserByEmail(emailFromPayload);
    if (!matchedUser) {
      console.warn(`webhook received for unknown email: ${emailFromPayload}`);
      return res
        .status(200)
        .json({ success: false, message: "Unknown tenant" });
    }
    tenantId = matchedUser.id;
  }

  let result: WebhookProcessedResult | null = null;
  try {
    result = (await processWebhook(corsair, headers, body, {
      ...(tenantId && { tenantId }),
    })) as WebhookProcessedResult;
  } catch (webhookError) {
    console.error("webhook processing failed:", webhookError);
    return res
      .status(200)
      .json({ success: false, message: "Webhook processing failed" });
  }

  if (result?.responseHeaders) {
    for (const [key, value] of Object.entries(result.responseHeaders)) {
      res.setHeader(key, value);
    }
  }

  return res.status(200).json(result?.response ?? { success: true });
});

webhooksRouter.get("/", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
});

export { webhooksRouter };
