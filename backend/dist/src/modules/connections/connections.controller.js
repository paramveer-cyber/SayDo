import { getConnectionStatus, connectPlugin, getPluginAccessToken, disconnectPlugin, } from "./connections.services.js";
import { ok } from "../../common/utils/response.js";
export const getStatus = async (req, res, next) => {
    try {
        const status = await getConnectionStatus(req.user.userId);
        return ok(res, "Connection status fetched", status);
    }
    catch (err) {
        next(err);
    }
};
export const exchangeCode = async (req, res, next) => {
    try {
        const plugin = req.params.plugin;
        const { authCode } = req.body;
        const result = await connectPlugin(req.user.userId, plugin, authCode);
        return ok(res, "Connected successfully", result, 201);
    }
    catch (err) {
        next(err);
    }
};
export const getToken = async (req, res, next) => {
    try {
        const plugin = req.params.plugin;
        const result = await getPluginAccessToken(req.user.userId, plugin);
        return ok(res, "Token fetched", result);
    }
    catch (err) {
        next(err);
    }
};
export const disconnect = async (req, res, next) => {
    try {
        const plugin = req.params.plugin;
        const result = await disconnectPlugin(req.user.userId, plugin);
        return ok(res, "Disconnected successfully", result);
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=connections.controller.js.map