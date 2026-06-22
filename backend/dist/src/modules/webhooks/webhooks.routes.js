import { Router } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { findUserByEmail } from "../auth/auth.queries.js";
const webhooksRouter = Router();
const resolveEmailFromPubSubPayload = (body) => {
    try {
        const messageData = body.message?.data;
        if (!messageData)
            return null;
        const decoded = Buffer.from(messageData, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        return parsed.emailAddress ?? null;
    }
    catch {
        return null;
    }
};
webhooksRouter.post("/", async (req, res) => {
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string")
            headers[key] = value;
        else if (Array.isArray(value))
            headers[key] = value[0];
    }
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const emailFromPayload = resolveEmailFromPubSubPayload(body);
    let tenantId = req.query.tenant;
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
    let result = null;
    try {
        result = (await processWebhook(corsair, headers, body, {
            ...(tenantId && { tenantId }),
        }));
    }
    catch (webhookError) {
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
webhooksRouter.get("/", (_req, res) => {
    return res.json({
        status: "ok",
        message: "Webhook endpoint is active",
        timestamp: new Date().toISOString(),
    });
});
export { webhooksRouter };
//# sourceMappingURL=webhooks.routes.js.map