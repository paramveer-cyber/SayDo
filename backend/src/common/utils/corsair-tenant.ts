import { corsair } from "../../corsair.js";
import { isRecoverableAuthHiccup } from "./corsair-error.js";

type AnyFunction = (...args: unknown[]) => Promise<unknown>;
type AnyRecord = Record<string, unknown>;

const AUTH_RETRY_DELAYS_MS = [300, 750, 1500];

const withAuthRetry =
  (apiCall: AnyFunction): AnyFunction =>
  async (...args: unknown[]) => {
    let lastError: unknown;
    for (const delayMs of [0, ...AUTH_RETRY_DELAYS_MS]) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      try {
        return await apiCall(...args);
      } catch (err) {
        lastError = err;
        if (!isRecoverableAuthHiccup(err)) {
          throw err;
        }
      }
    }
    throw lastError;
  };

const wrapApiTreeWithRetry = (apiNode: AnyRecord): AnyRecord => {
  const wrappedNode: AnyRecord = {};
  for (const key of Object.keys(apiNode)) {
    const value = apiNode[key];
    if (typeof value === "function") {
      wrappedNode[key] = withAuthRetry(value as AnyFunction);
    } else if (value && typeof value === "object") {
      wrappedNode[key] = wrapApiTreeWithRetry(value as AnyRecord);
    } else {
      wrappedNode[key] = value;
    }
  }
  return wrappedNode;
};

const tenantCache = new Map<string, ReturnType<typeof corsair.withTenant>>();

export const getTenantCorsair = (userId: string) => {
  const cached = tenantCache.get(userId);
  if (cached) return cached;

  const tenant = corsair.withTenant(userId);
  const tenantAsRecord = tenant as unknown as AnyRecord;
  for (const pluginId of Object.keys(tenantAsRecord)) {
    const plugin = tenantAsRecord[pluginId] as AnyRecord | undefined;
    if (plugin && typeof plugin === "object" && "api" in plugin) {
      plugin.api = wrapApiTreeWithRetry(plugin.api as AnyRecord);
    }
  }

  tenantCache.set(userId, tenant);
  return tenant;
};

export const evictTenantFromCache = (userId: string): void => {
  tenantCache.delete(userId);
};
