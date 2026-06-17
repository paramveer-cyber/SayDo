import { processWebhook } from "corsair";
import { corsair } from "../../corsair.js";
import { hashTenantId, resolveTenantId } from "../../common/utils/tenant-hash.js";
export const handleWebhook = async (req, res, next) => {
    try {
        const hashedTenantId = req.query.tenant;
        const tenantId = resolveTenantId(hashedTenantId);
        const rawBody = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);
        const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)]));
        const query = {};
        if (tenantId)
            query.tenantId = tenantId;
        const result = await processWebhook(corsair, headers, rawBody, query);
        if (result.plugin) {
            console.log(`Webhook handled: ${result.plugin}.${result.action}`);
        }
        if (result.responseHeaders) {
            Object.entries(result.responseHeaders).forEach(([k, v]) => res.setHeader(k, v));
        }
        const statusCode = result.response?.statusCode ?? (result.response?.success === false ? 500 : 200);
        const responseBody = result.response?.returnToSender ?? { received: true };
        return res.status(statusCode).json(responseBody);
    }
    catch (err) {
        next(err);
    }
};
export const getWebhookUrl = async (req, res, next) => {
    try {
        const userId = req.user;
        const hashedTenantId = await hashTenantId(userId);
        const webhookUrl = `${process.env.API_URL}/webhooks?tenant=${hashedTenantId}`;
        return res.status(200).json({ success: true, message: "Webhook URL generated", data: { url: webhookUrl } });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=webhooks.controller.js.map