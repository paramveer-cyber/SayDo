import { Router } from "express";
import { CommandCenterController } from "./command-center.controller.js";
const commandCenterController = new CommandCenterController();
const commandCenterRouter = Router();
commandCenterRouter.get("/overview", commandCenterController.getOverview);
export { commandCenterRouter };
//# sourceMappingURL=command-center.routes.js.map