import bcrypt from "bcryptjs";
const SALT_ROUNDS = 10;
const tenantHashCache = new Map();
export const hashTenantId = async (userId) => {
    const existing = [...tenantHashCache.entries()].find(([, id]) => id === userId);
    if (existing)
        return existing[0];
    const hashed = await bcrypt.hash(userId, SALT_ROUNDS);
    tenantHashCache.set(hashed, userId);
    return hashed;
};
export const resolveTenantId = (hashedTenantId) => {
    if (!hashedTenantId)
        return undefined;
    return tenantHashCache.get(hashedTenantId);
};
//# sourceMappingURL=tenant-hash.js.map