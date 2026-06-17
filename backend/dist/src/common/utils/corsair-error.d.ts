import { ApiError } from "./api-error.js";
export declare const isUnauthorizedFromUpstream: (error: Error) => boolean;
export declare const isTokenRefreshFailure: (error: Error) => boolean;
export declare const isRecoverableAuthHiccup: (error: unknown) => boolean;
export declare const mapCorsairError: (error: unknown) => ApiError | null;
//# sourceMappingURL=corsair-error.d.ts.map