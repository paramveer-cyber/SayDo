import { verifyToken } from "../../common/utils/tokenLogic.js";
import { ApiError } from "../../common/utils/api-error.js";
export const authMiddleware = (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return next(ApiError.unAuthorized("Missing Bearer token"));
        }
        const token = authHeader.split(" ")[1];
        try {
            const user = verifyToken(token);
            req.user = user.userId;
            return next();
        }
        catch (err) {
            if (err instanceof Error && err.name === "TokenExpiredError") {
                return next(ApiError.unAuthorized("Token expired"));
            }
            return next(ApiError.unAuthorized("Invalid token"));
        }
    }
    catch {
        return next(ApiError.unAuthorized("Unauthorized"));
    }
};
//# sourceMappingURL=auth.middleware.js.map