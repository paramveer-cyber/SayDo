import { Router } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { findUserByEmail } from "../auth/auth.queries.js";
const webhooksRouter = Router();
const decodeEmailFromPubSubPayload = (body) => {
    try {
        const messageData = body.message
            ?.data;
        if (typeof messageData !== "string")
            return null;
        const decoded = JSON.parse(Buffer.from(messageData, "base64").toString("utf-8"));
        return typeof decoded.emailAddress === "string"
            ? decoded.emailAddress
            : null;
    }
    catch {
        console.warn("failed to decode Pub/Sub payload");
        return null;
    }
};
const isStaleWebhookError = (error) => {
    if (!(error instanceof Error))
        return false;
    return (error.message.includes("Account not found") ||
        error.status === 404);
};
const isNetworkTimeout = (error) => {
    if (!(error instanceof TypeError))
        return false;
    const cause = error.cause;
    return cause?.code === "ETIMEDOUT" || cause?.code === "UND_ERR_CONNECT_TIMEOUT";
};
webhooksRouter.post("/", async (req, res) => {
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string")
            headers[key] = value;
        else if (Array.isArray(value)) {
            headers[key] = value[0];
        }
    }
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const emailFromPayload = decodeEmailFromPubSubPayload(body);
    let resolvedTenantId;
    if (emailFromPayload) {
        const user = await findUserByEmail(emailFromPayload);
        if (!user) {
            return res
                .status(200)
                .json({ success: false, message: "Unknown tenant email" });
        }
        resolvedTenantId = user.id;
    }
    else {
        resolvedTenantId = req.query.tenant;
    }
    let result;
    try {
        result = (await processWebhook(corsair, headers, body, {
            ...(resolvedTenantId && { tenantId: resolvedTenantId }),
        }));
    }
    catch (webhookError) {
        if (isNetworkTimeout(webhookError)) {
            console.warn("webhook skipped: Render egress blocked to Google APIs");
        }
        else if (isStaleWebhookError(webhookError)) {
            console.warn("webhook skipped (stale):", webhookError.message);
        }
        else {
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
webhooksRouter.get("/", (_req, res) => {
    return res.json({
        status: "ok",
        message: "Webhook endpoint is active",
        timestamp: new Date().toISOString(),
    });
});
export { webhooksRouter };
//# sourceMappingURL=webhooks.routes.js.map