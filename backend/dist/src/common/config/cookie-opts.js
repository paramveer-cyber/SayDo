export const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax"),
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
//# sourceMappingURL=cookie-opts.js.map