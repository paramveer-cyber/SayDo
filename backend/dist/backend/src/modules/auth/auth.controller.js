import { corsair } from "../../corsair.js";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";
import { registerLocalUser, loginLocalUser, verifyGoogleToken, findOrCreateGoogleUser, } from "./auth.services.js";
import { generateToken, generateRefreshToken, verifyRefreshToken, } from "../../common/utils/tokenLogic.js";
import { findUserById, findUserByRefreshToken, setUserRefreshToken, deleteUserById, rotateRefreshToken, } from "./auth.queries.js";
import { ApiError } from "../../common/utils/api-error.js";
import { ok, created } from "../../common/utils/response.js";
const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax"),
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
const formatUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    provider: u.provider,
    createdAt: u.createdAt,
});
export const register = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } = await registerLocalUser(req.body);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
        return created(res, "Account created", {
            token: accessToken,
            user: formatUser(user),
        });
    }
    catch (err) {
        next(err);
    }
};
export const login = async (req, res, next) => {
    try {
        const { user, accessToken, refreshToken } = await loginLocalUser(req.body);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
        return ok(res, "Login successful", {
            token: accessToken,
            user: formatUser(user),
        });
    }
    catch (err) {
        next(err);
    }
};
export const googleAuth = async (req, res, next) => {
    try {
        const payload = await verifyGoogleToken(req.body.idToken);
        const { user, accessToken, refreshToken } = await findOrCreateGoogleUser(payload);
        res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
        return ok(res, "Login successful", {
            token: accessToken,
            user: formatUser(user),
        });
    }
    catch (err) {
        next(err);
    }
};
export const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token)
            throw ApiError.unAuthorized("No refresh token");
        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        }
        catch {
            throw ApiError.unAuthorized("Invalid or expired refresh token");
        }
        const newRefreshToken = generateRefreshToken(decoded.userId);
        const rotated = await rotateRefreshToken(token, newRefreshToken);
        if (!rotated) {
            res.clearCookie("refreshToken");
            throw ApiError.unAuthorized("Refresh token reuse detected");
        }
        const user = await findUserById(decoded.userId);
        if (!user) {
            res.clearCookie("refreshToken");
            throw ApiError.unAuthorized("User not found");
        }
        const newAccessToken = generateToken(user.id, user.email);
        res.cookie("refreshToken", newRefreshToken, COOKIE_OPTS);
        return ok(res, "Token refreshed", { token: newAccessToken });
    }
    catch (err) {
        next(err);
    }
};
export const getMe = async (req, res, next) => {
    try {
        const user = await findUserById(req.user);
        if (!user)
            throw ApiError.notFound("User not found");
        return ok(res, "User fetched", { user: formatUser(user) });
    }
    catch (err) {
        next(err);
    }
};
export const logout = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            const user = await findUserByRefreshToken(token);
            if (user)
                await setUserRefreshToken(user.id, null);
        }
        res.clearCookie("refreshToken");
        return ok(res, "Logged out");
    }
    catch (err) {
        next(err);
    }
};
export const getConnectLink = async (req, res, next) => {
    try {
        const { pluginId } = req.query;
        if (!pluginId)
            throw ApiError.badRequest("pluginId query param required");
        const redirectUri = `${process.env.API_URL}/auth/callback`;
        const { url } = await generateOAuthUrl(corsair, pluginId, {
            tenantId: req.user,
            redirectUri,
        });
        return ok(res, "Connect link generated", { url });
    }
    catch (err) {
        next(err);
    }
};
export const oauthCallback = async (req, res, next) => {
    try {
        const { code, state } = req.query;
        const redirectUri = `${process.env.API_URL}/auth/callback`;
        await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri,
        });
        const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
        return res.redirect(`${frontendUrl}/connect?connected=true`);
    }
    catch (err) {
        next(err);
    }
};
export const deleteAccount = async (req, res, next) => {
    try {
        const user = await findUserById(req.user);
        if (!user)
            throw ApiError.notFound("User not found");
        await deleteUserById(req.user);
        res.clearCookie("refreshToken");
        return ok(res, "Account deleted");
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=auth.controller.js.map