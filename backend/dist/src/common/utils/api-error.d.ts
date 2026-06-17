export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(statusCode: number, message: string);
    static notFound(message?: string): ApiError;
    static badRequest(message?: string): ApiError;
    static unAuthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static internal(message?: string): ApiError;
    static conflict(message?: string): ApiError;
    static tooManyRequests(message?: string): ApiError;
}
//# sourceMappingURL=api-error.d.ts.map