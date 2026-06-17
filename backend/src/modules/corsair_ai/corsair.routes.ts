import { Router } from "express";
import { promptAI } from "./corsair.controller.js";
import { validate } from "../../common/middleware/validate.js";
import { promptBody } from "./corsair.modals.js";

const aiCorsairRouter = Router();

aiCorsairRouter.post("/prompt", validate(promptBody), promptAI);

export { aiCorsairRouter };
