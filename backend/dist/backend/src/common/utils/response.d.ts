import type { Response } from "express";
export declare const ok: (res: Response, message: string, data?: unknown, status?: number) => Response<any, Record<string, any>>;
export declare const created: (res: Response, message: string, data?: unknown) => Response<any, Record<string, any>>;
export declare const fail: (res: Response, message: string, status?: number, errors?: unknown) => Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map