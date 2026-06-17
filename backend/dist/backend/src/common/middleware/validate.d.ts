import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
export declare function validate<T>(schema: z.ZodType<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateParams<T>(schema: z.ZodType<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateQuery<T>(schema: z.ZodType<T>): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validate.d.ts.map