import { ApiError } from "../utils/api-error.js";
import util from "node:util";
import { mapCorsairError } from "../utils/corsair-error.js";
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof ApiError && err.isOperational) {
        return res
            .status(err.statusCode)
            .json({ success: false, message: err.message });
    }
    const corsairError = mapCorsairError(err);
    if (corsairError) {
        return res
            .status(corsairError.statusCode)
            .json({ success: false, message: corsairError.message });
    }
    if (typeof err === "object" && err !== null && "code" in err) {
        const dbError = err;
        if (dbError.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A record with that value already exists",
            });
        }
        if (dbError.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Invalid reference — related record does not exist",
            });
        }
    }
    // prodn log
    console.error("unhandled error:", util.inspect(err, { depth: 3 }));
    return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
};
export default errorHandler;
//# sourceMappingURL=error.middleware.js.map