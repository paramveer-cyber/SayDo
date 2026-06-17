import type { Request, Response, NextFunction } from "express";
export declare const handleWebhook: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getWebhookUrl: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=webhooks.controller.d.ts.map