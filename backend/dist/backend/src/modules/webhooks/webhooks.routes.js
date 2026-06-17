import { Router } from "express";
import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
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
    const result = await processWebhook(corsair, headers, body, {
        ...(tenantId && { tenantId }),
    });
    console.info("Webhook processed:", result.plugin, result.action);
    const responseHeaders = result.responseHeaders;
    if (responseHeaders) {
        for (const [key, value] of Object.entries(responseHeaders)) {
            res.setHeader(key, value);
        }
    }
    if (!result.response) {
        return res
            .status(404)
            .json({ success: false, message: "No matching webhook handler found" });
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