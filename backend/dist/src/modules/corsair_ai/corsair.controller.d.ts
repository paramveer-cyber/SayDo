import type { Request, Response, NextFunction } from "express";
import type { PromptBody } from "./corsair.modals.js";
export declare const promptAI: (req: Request<{}, {}, PromptBody>, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=corsair.controller.d.ts.map