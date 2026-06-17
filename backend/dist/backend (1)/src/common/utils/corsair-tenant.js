import { corsair } from "../../corsair.js";
const tenantCache = new Map();
export const getTenantCorsair = (userId) => {
    const cached = tenantCache.get(userId);
    if (cached)
        return cached;
    const tenant = corsair.withTenant(userId);
    tenantCache.set(userId, tenant);
    return tenant;
};
//# sourceMappingURL=corsair-tenant.js.map