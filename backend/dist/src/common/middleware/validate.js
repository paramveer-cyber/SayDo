import { z, ZodError } from "zod";
const formatZodErrors = (error) => error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
}));
export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: formatZodErrors(result.error),
            });
        }
        req.body = result.data;
        return next();
    };
}
export function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid path parameters",
                errors: formatZodErrors(result.error),
            });
        }
        Object.assign(req.params, result.data);
        return next();
    };
}
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: formatZodErrors(result.error),
            });
        }
        Object.assign(req.query, result.data);
        return next();
    };
}
//# sourceMappingURL=validate.js.map