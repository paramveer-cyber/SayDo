import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { validate, validateParams } from "../../common/middleware/validate.js";
import { PluginParamSchema, ExchangeAuthCodeSchema, } from "./connections.modal.js";
import { getStatus, exchangeCode, getToken, disconnect, } from "./connections.controller.js";
export const connectionsRouter = Router();
connectionsRouter.use(authMiddleware);
connectionsRouter.get("/status", getStatus);
connectionsRouter.post("/:plugin", validateParams(PluginParamSchema), validate(ExchangeAuthCodeSchema), exchangeCode);
connectionsRouter.get("/:plugin/token", validateParams(PluginParamSchema), getToken);
connectionsRouter.delete("/:plugin", validateParams(PluginParamSchema), disconnect);
//# sourceMappingURL=connections.routes.js.map