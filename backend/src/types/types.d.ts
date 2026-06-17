import type { userSettings, users } from "../db/schema.js";

declare global {
  namespace Express {
    export interface Request {
      user: string;
      userRole?: typeof users.$inferSelect["role"];
      userSettings?: typeof userSettings.$inferSelect;
    }
    export interface Response {
      user: string;
    }
  }
}

export {};
