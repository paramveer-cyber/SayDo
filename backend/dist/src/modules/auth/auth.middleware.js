import { verifyToken, verifyRefreshToken, generateToken, generateRefreshToken, } from "../../common/utils/tokenLogic.js";
import { ApiError } from "../../common/utils/api-error.js";
import { findUserByRefreshToken, rotateRefreshToken, findUserById, } from "./auth.queries.js";
const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return next(ApiError.unAuthorized("Missing Bearer token"));
        }
        const token = authHeader.split(" ")[1];
        try {
            const decoded = verifyToken(token);
            req.user = decoded.userId;
            const user = await findUserById(decoded.userId);
            if (!user)
                return next(ApiError.unAuthorized("User not found"));
            req.userRole = user.role;
            return next();
        }
        catch (err) {
            if (!(err instanceof Error) || err.name !== "TokenExpiredError") {
                return next(ApiError.unAuthorized("Invalid token"));
            }
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                return next(ApiError.unAuthorized("Token expired"));
            }
            try {
                const decoded = verifyRefreshToken(refreshToken);
                const user = await findUserByRefreshToken(refreshToken);
                if (!user || user.id !== decoded.userId) {
                    return next(ApiError.unAuthorized("Invalid refresh token"));
                }
                const newRefreshToken = generateRefreshToken(user.id);
                const rotated = await rotateRefreshToken(refreshToken, newRefreshToken);
                if (!rotated) {
                    return next(ApiError.unAuthorized("Refresh token reuse detected"));
                }
                const newAccessToken = generateToken(user.id);
                res.cookie("refreshToken", newRefreshToken, COOKIE_OPTS);
                res.setHeader("x-access-token", newAccessToken);
                req.user = user.id;
                req.userRole = user.role;
                return next();
            }
            catch {
                return next(ApiError.unAuthorized("Token expired"));
            }
        }
    }
    catch {
        return next(ApiError.unAuthorized("Unauthorized"));
    }
};
//# sourceMappingURL=auth.middleware.js.map