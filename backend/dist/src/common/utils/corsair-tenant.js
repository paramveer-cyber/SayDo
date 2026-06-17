import { corsair } from "../../corsair.js";
import { isRecoverableAuthHiccup } from "./corsair-error.js";
const AUTH_RETRY_DELAY_MS = 750;
const withAuthRetry = (apiCall) => async (...args) => {
    try {
        return await apiCall(...args);
    }
    catch (firstAttemptError) {
        if (!isRecoverableAuthHiccup(firstAttemptError)) {
            throw firstAttemptError;
        }
        await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAY_MS));
        return await apiCall(...args);
    }
};
const wrapApiTreeWithRetry = (apiNode) => {
    const wrappedNode = {};
    for (const key of Object.keys(apiNode)) {
        const value = apiNode[key];
        if (typeof value === "function") {
            wrappedNode[key] = withAuthRetry(value);
        }
        else if (value && typeof value === "object") {
            wrappedNode[key] = wrapApiTreeWithRetry(value);
        }
        else {
            wrappedNode[key] = value;
        }
    }
    return wrappedNode;
};
const tenantCache = new Map();
export const getTenantCorsair = (userId) => {
    const cached = tenantCache.get(userId);
    if (cached)
        return cached;
    const tenant = corsair.withTenant(userId);
    const tenantAsRecord = tenant;
    for (const pluginId of Object.keys(tenantAsRecord)) {
        const plugin = tenantAsRecord[pluginId];
        if (plugin && typeof plugin === "object" && "api" in plugin) {
            plugin.api = wrapApiTreeWithRetry(plugin.api);
        }
    }
    tenantCache.set(userId, tenant);
    return tenant;
};
export const evictTenantFromCache = (userId) => {
    tenantCache.delete(userId);
};
//# sourceMappingURL=corsair-tenant.js.map