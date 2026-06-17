import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import { UpdateSettingsSchema } from "./settings.modal.js";
import { getSettings, patchSettings } from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/", getSettings);
settingsRouter.patch("/", validate(UpdateSettingsSchema), patchSettings);
