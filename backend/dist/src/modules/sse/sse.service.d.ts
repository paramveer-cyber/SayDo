import type { Response } from "express";
export declare const registerSseClient: (userId: string, res: Response) => (() => void);
export declare const sendEventToUser: (userId: string, eventName: string, payload: unknown) => void;
export declare const getConnectedUserCount: () => number;
//# sourceMappingURL=sse.service.d.ts.map