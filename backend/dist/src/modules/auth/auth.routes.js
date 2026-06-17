import { Router } from "express";
import { register, login, googleAuth, refresh, getMe, logout, deleteAccount, getConnectLink, oauthCallback, disconnectPlugin, } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import { validate } from "../../common/middleware/validate.js";
import { authRateLimiter } from "../../common/middleware/rateLimiter.js";
import { RegisterSchema, LoginSchema, GoogleAuthSchema } from "./auth.modal.js";
export const authRouter = Router();
authRouter.post("/register", authRateLimiter, validate(RegisterSchema), register);
authRouter.post("/login", authRateLimiter, validate(LoginSchema), login);
authRouter.post("/google", authRateLimiter, validate(GoogleAuthSchema), googleAuth);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authMiddleware, getMe);
authRouter.get("/connect-link", authMiddleware, getConnectLink);
authRouter.get("/callback", oauthCallback);
authRouter.delete("/account", authMiddleware, deleteAccount);
authRouter.delete("/plugins/:pluginId", authMiddleware, disconnectPlugin);
//# sourceMappingURL=auth.routes.js.map