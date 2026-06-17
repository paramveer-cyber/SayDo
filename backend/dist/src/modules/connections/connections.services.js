import { ApiError } from "../../common/utils/api-error.js";
import { getUserConnections, setUserConnection, removeUserConnection, } from "./connections.queries.js";
import { PLUGIN_SCOPES } from "./connections.config.js";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const EXPIRY_BUFFER_MS = 5 * 60 * 1000;
const exchangeAuthCode = async (authCode) => {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code: authCode,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: "postmessage",
            grant_type: "authorization_code",
        }),
    });
    return (await res.json());
};
const refreshAccessToken = async (refreshToken) => {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            refresh_token: refreshToken,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            grant_type: "refresh_token",
        }),
    });
    return (await res.json());
};
const revokeToken = async (token) => {
    try {
        await fetch(`${REVOKE_URL}?token=${token}`, { method: "POST" });
    }
    catch {
        // best-effort, ignore failures
    }
};
export const getConnectionStatus = async (userId) => {
    const connections = await getUserConnections(userId);
    const status = {};
    for (const plugin of Object.keys(PLUGIN_SCOPES)) {
        status[plugin] = Boolean(connections[plugin]);
    }
    return status;
};
export const connectPlugin = async (userId, plugin, authCode) => {
    const data = await exchangeAuthCode(authCode);
    if (!data.access_token || !data.refresh_token || !data.expires_in) {
        throw ApiError.badRequest(data.error_description ?? "Failed to exchange authorization code");
    }
    const connection = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        scope: data.scope ?? PLUGIN_SCOPES[plugin].join(" "),
    };
    await setUserConnection(userId, plugin, connection);
    return { connected: true };
};
export const getPluginAccessToken = async (userId, plugin) => {
    const connections = await getUserConnections(userId);
    const connection = connections[plugin];
    if (!connection) {
        return { token: null, expiry: null };
    }
    const expiresSoon = new Date(connection.expiry).getTime() < Date.now() + EXPIRY_BUFFER_MS;
    if (!expiresSoon) {
        return {
            token: connection.accessToken,
            expiry: new Date(connection.expiry).getTime(),
        };
    }
    const refreshed = await refreshAccessToken(connection.refreshToken);
    if (!refreshed.access_token || !refreshed.expires_in) {
        await removeUserConnection(userId, plugin);
        return { token: null, expiry: null };
    }
    const updated = {
        ...connection,
        accessToken: refreshed.access_token,
        expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    };
    await setUserConnection(userId, plugin, updated);
    return {
        token: updated.accessToken,
        expiry: new Date(updated.expiry).getTime(),
    };
};
export const disconnectPlugin = async (userId, plugin) => {
    const connections = await getUserConnections(userId);
    const connection = connections[plugin];
    if (connection?.refreshToken) {
        await revokeToken(connection.refreshToken);
    }
    await removeUserConnection(userId, plugin);
    return { connected: false };
};
//# sourceMappingURL=connections.services.js.map