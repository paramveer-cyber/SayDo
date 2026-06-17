import { Router } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { inngest } from "../../common/config/inngest.client.js";
const webhooksRouter = Router();
const seenHistoryIds = new Map();
webhooksRouter.post("/", async (req, res) => {
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string")
            headers[key] = value;
        else if (Array.isArray(value)) {
            headers[key] = value[0];
        }
    }
    const tenantId = req.query.tenant;
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    console.info("[webhook] incoming");
    let decodedData = {};
    if (tenantId && body.message?.data) {
        try {
            decodedData = JSON.parse(Buffer.from(body.message.data, "base64").toString("utf-8"));
            const incomingHistoryId = decodedData.historyId;
            const seenIds = seenHistoryIds.get(tenantId) ?? [];
            if (incomingHistoryId && seenIds.includes(incomingHistoryId)) {
                console.info(`[webhook] skip — duplicate historyId ${incomingHistoryId} (seen ${seenIds.length} total) tenant: ${tenantId}`);
                return res.status(200).json({ success: true });
            }
            if (incomingHistoryId) {
                seenIds.push(incomingHistoryId);
                seenHistoryIds.set(tenantId, seenIds);
                console.info(`[webhook] new historyId ${incomingHistoryId} (total seen: ${seenIds.length}) tenant: ${tenantId} — processing`);
            }
            else {
                console.info(`[webhook] no historyId in payload tenant: ${tenantId} — proceeding anyway`);
            }
        }
        catch {
            console.info("[webhook] failed to decode pubsub payload — proceeding anyway");
        }
    }
    const result = (await processWebhook(corsair, headers, body, {
        ...(tenantId && { tenantId }),
    }));
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
    const isGmailMessageChanged = result.plugin === "gmail" && result.action === "messageChanged";
    if (isGmailMessageChanged && tenantId) {
        const messageId = result.body?.message?.messageId;
        console.info("[webhook] gmail messageChanged, messageId:", messageId);
        if (messageId) {
            const tenantCorsair = corsair.withTenant(tenantId);
            // console.log(messageId);
            const messages = await tenantCorsair.gmail.db.messages.search({
                data: { historyId: { equals: decodedData.historyId } },
                limit: 10,
                offset: 0,
            });
            const messageRow = messages[0];
            const message = messageRow?.data;
            if (message) {
                const isInbox = message.labelIds?.includes("INBOX");
                console.info("[webhook] message found in db, isInbox:", isInbox, "subject:", message.subject);
                if (isInbox) {
                    console.info("[webhook] firing inngest email/received for messageId:", messageId);
                    await inngest.send({
                        name: "email/received",
                        data: {
                            messageId: message.id ?? messageId,
                            tenantId,
                            from: message.from ?? "",
                            subject: message.subject ?? "",
                            snippet: message.snippet ?? "",
                            body: message.body ?? "",
                            labelIds: message.labelIds ?? [],
                        },
                    });
                }
                else {
                    console.info("[webhook] message not in INBOX, skipping inngest", messageId);
                }
            }
            else {
                console.info("[webhook] message not yet in db, skipping inngest", messageId);
            }
        }
    }
    return res.status(200).json(result.response);
});
webhooksRouter.get("/", (_req, res) => {
    return res.json({
        status: "ok",
        message: "Webhook endpoint is active",
        timestamp: new Date().toISOString(),
    });
});
export { webhooksRouter };
//# sourceMappingURL=webhooks.routes.js.map