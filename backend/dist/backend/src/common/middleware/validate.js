import { z, ZodError } from "zod";
export function validate(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: err.issues.flat(),
                });
            }
            next(err);
        }
    };
}
export function validateParams(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.params);
            Object.assign(req.params, parsed);
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: err.issues.flat(),
                });
            }
            next(err);
        }
    };
}
export function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.query);
            Object.assign(req.query, parsed);
            next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: err.issues.flat(),
                });
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map