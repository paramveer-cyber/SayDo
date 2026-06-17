import { Router, type Request, type Response } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { inngest } from "../../common/config/inngest.client.js";
import { getExistingPriorityLabelIds } from "../inngest/email.functions.js";
import { sendEventToUser } from "../sse/sse.service.js";
import type {
  WebhookProcessedResult,
  CorsairGmailMessageRow,
} from "./webhooks.types.js";

const webhooksRouter = Router();

webhooksRouter.post("/", async (req: Request, res: Response) => {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value)) {
      headers[key] = value[0]!;
    }
  }

  const tenantId = req.query.tenant as string | undefined;

  const body =
    typeof req.body === "object" && req.body !== null ? req.body : {};

  console.info("[webhook] incoming");

  const result = (await processWebhook(corsair, headers, body, {
    ...(tenantId && { tenantId }),
  })) as WebhookProcessedResult;

  console.info("[webhook] processed", result.plugin, result.action);

  if (result.responseHeaders) {
    for (const [key, value] of Object.entries(result.responseHeaders)) {
      res.setHeader(key, value);
    }
  }

  if (!result.response) {
    return res
      .status(404)
      .json({ success: false, message: "No matching webhook handler found" });
  }

  const isGmailMessageChanged =
    result.plugin === "gmail" && result.action === "messageChanged";

  if (isGmailMessageChanged && tenantId) {
    const messageId = result.body?.message?.messageId;

    console.info("[webhook] gmail messageChanged, messageId:", messageId);

    const tenantCorsair = corsair.withTenant(tenantId);

    const recentRows = await tenantCorsair.gmail.db.messages.search({
      data: { labelIds: { contains: "INBOX" } },
      limit: 20,
      offset: 0,
    });

    const recentMessages = (recentRows as CorsairGmailMessageRow[])
      .map((row) => row.data)
      .filter((message) => !!message?.id)
      .sort(
        (a, b) => (Number(b.internalDate) || 0) - (Number(a.internalDate) || 0),
      )
      .slice(0, 1);

    const newestMessage = recentMessages[0];

    if (newestMessage) {
      const priorityLabelIds = await getExistingPriorityLabelIds(tenantCorsair);

      const alreadyPrioritized = (newestMessage.labelIds ?? []).some(
        (labelId) => priorityLabelIds.has(labelId),
      );

      if (alreadyPrioritized) {
        console.info(
          `[webhook] skip — already prioritized: ${newestMessage.id} (${newestMessage.subject})`,
        );
      } else {
        console.info(
          `[webhook] prioritizing newest message: ${newestMessage.id} (${newestMessage.subject})`,
        );

        sendEventToUser(tenantId, "new_email", {
          messageId: newestMessage.id ?? "",
          from: newestMessage.from ?? "",
          subject: newestMessage.subject ?? "",
          snippet: newestMessage.snippet ?? "",
        });

        await inngest.send({
          name: "email/received",
          data: {
            messageId: newestMessage.id ?? "",
            tenantId,
            from: newestMessage.from ?? "",
            subject: newestMessage.subject ?? "",
            snippet: newestMessage.snippet ?? "",
            body: newestMessage.body ?? "",
            labelIds: newestMessage.labelIds ?? [],
          },
        });
      }
    }
  }

  return res.status(200).json(result.response);
});

webhooksRouter.get("/", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
});

export { webhooksRouter };
