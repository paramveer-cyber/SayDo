export class ApiError extends Error {
    statusCode;
    isOperational;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
    static notFound(message = "Not found") {
        return new ApiError(404, message);
    }
    static badRequest(message = "Bad request") {
        return new ApiError(400, message);
    }
    static unAuthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }
    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }
    static internal(message = "Internal server error") {
        return new ApiError(500, message);
    }
    static conflict(message = "Conflict Occured!") {
        return new ApiError(409, message);
    }
}
//# sourceMappingURL=api-error.js.map