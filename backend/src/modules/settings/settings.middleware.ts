import type { Request, Response, NextFunction } from "express";
import {
  findSettingsByUserId,
  createDefaultSettings,
} from "../auth/auth.queries.js";

export const injectUserSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user as string;
    let settings = await findSettingsByUserId(userId);
    if (!settings) settings = await createDefaultSettings(userId);
    if (settings) req.userSettings = settings;
    return next();
  } catch (err) {
    next(err);
  }
};
