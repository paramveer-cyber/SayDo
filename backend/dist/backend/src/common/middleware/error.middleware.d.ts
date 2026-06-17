import type { Request, Response, NextFunction } from "express";
declare const errorHandler: (err: unknown, _req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
export default errorHandler;
//# sourceMappingURL=error.middleware.d.ts.map