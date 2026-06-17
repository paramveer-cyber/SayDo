import jwt, {} from "jsonwebtoken";
export const generateToken = (id) => jwt.sign({ userId: id }, process.env.JWT_SECRET, {
    expiresIn: 900,
    issuer: "SayDo",
});
export const generateRefreshToken = (id) => jwt.sign({ userId: id }, process.env.REFRESH_SECRET, {
    expiresIn: 604800,
    issuer: "SayDo",
});
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "SayDo",
});
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.REFRESH_SECRET, {
    issuer: "SayDo",
});
//# sourceMappingURL=tokenLogic.js.map