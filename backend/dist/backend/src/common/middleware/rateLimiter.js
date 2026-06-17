import rateLimit from "express-rate-limit";
export const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Please try again later." },
});
//# sourceMappingURL=rateLimiter.js.map