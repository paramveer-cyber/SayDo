import { Router } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { inngest } from "../../common/config/inngest.client.js";
import { getExistingPriorityLabelIds } from "../inngest/email.functions.js";
import { sendEventToUser } from "../sse/sse.service.js";
import { findUserById } from "../auth/auth.queries.js";
import { canAccessWorkflow } from "../../common/utils/rbac.js";
const webhooksRouter = Router();
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
    let result;
    try {
        result = (await processWebhook(corsair, headers, body, {
            ...(tenantId && { tenantId }),
        }));
    }
    catch (webhookError) {
        // prodn log
        console.error("webhook processing failed:", webhookError);
        return res
            .status(200)
            .json({ success: false, message: "Webhook processing failed" });
    }
    if (result.responseHeaders) {
        for (const [key, value] of Object.entries(result.responseHeaders)) {
            res.setHeader(key, value);
        }
    }
    if (!result.response) {
        return res
            .status(200)
            .json({ success: false, message: "No matching webhook handler found" });
    }
    const isGmailMessageChanged = result.plugin === "gmail" && result.action === "messageChanged";
    if (isGmailMessageChanged && tenantId) {
        const user = await findUserById(tenantId);
        const userRole = (user?.role ?? "user");
        const userCanPrioritizeEmail = canAccessWorkflow(userRole, "email-priority");
        if (!userCanPrioritizeEmail) {
            return res.status(200).json(result.response);
        }
        const tenantCorsair = corsair.withTenant(tenantId);
        const recentRows = await tenantCorsair.gmail.db.messages.search({
            data: { labelIds: { contains: "INBOX" } },
            limit: 20,
            offset: 0,
        });
        const recentMessages = recentRows
            .map((row) => row.data)
            .filter((message) => !!message?.id)
            .sort((a, b) => (Number(b.internalDate) || 0) - (Number(a.internalDate) || 0))
            .slice(0, 1);
        const newestMessage = recentMessages[0];
        if (newestMessage) {
            const priorityLabelIds = await getExistingPriorityLabelIds(tenantCorsair);
            const alreadyPrioritized = (newestMessage.labelIds ?? []).some((labelId) => priorityLabelIds.has(labelId));
            if (alreadyPrioritized) {
                return res.status(200).json(result.response);
            }
            // prodn log
            console.info(`email priority job dispatched: ${newestMessage.id}`);
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