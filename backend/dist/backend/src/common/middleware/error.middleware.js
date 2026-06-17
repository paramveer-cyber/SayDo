import { ApiError } from "../utils/api-error.js";
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError && err.isOperational) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    if (typeof err === "object" && err !== null && "code" in err) {
        const dbErr = err;
        if (dbErr.code === "23505") {
            return res.status(409).json({ message: "A record with that value already exists" });
        }
        if (dbErr.code === "23503") {
            return res.status(400).json({ message: "Invalid reference — related record does not exist" });
        }
    }
    console.error("[Unhandled Error]", err);
    return res.status(500).json({ message: "Internal server error" });
};
export default errorHandler;
//# sourceMappingURL=error.middleware.js.map