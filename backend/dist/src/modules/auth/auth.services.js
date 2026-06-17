import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import { ApiError } from "../../common/utils/api-error.js";
import { generateToken, generateRefreshToken, } from "../../common/utils/tokenLogic.js";
import { findUserByGoogleId, findUserByEmail, insertUser, setUserRefreshToken, createDefaultSettings, } from "./auth.queries.js";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const generateTokens = async (user) => {
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await setUserRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
};
export const registerLocalUser = async ({ name, email, password, }) => {
    const existing = await findUserByEmail(email);
    if (existing)
        throw ApiError.conflict("Email already registered");
    const hash = await bcrypt.hash(password, 12);
    const user = await insertUser({
        name,
        email,
        password: hash,
        provider: "local",
    });
    await createDefaultSettings(user.id);
    const { accessToken, refreshToken } = await generateTokens(user);
    return { user, accessToken, refreshToken };
};
export const loginLocalUser = async ({ email, password, }) => {
    const user = await findUserByEmail(email);
    if (!user || user.provider !== "local" || !user.password) {
        throw ApiError.unAuthorized("Invalid credentials");
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
        throw ApiError.unAuthorized("Invalid credentials");
    const { accessToken, refreshToken } = await generateTokens(user);
    return { user, accessToken, refreshToken };
};
export const verifyGoogleToken = async (idToken) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload ||
        !["accounts.google.com", "https://accounts.google.com"].includes(payload.iss) ||
        !payload.email_verified) {
        throw ApiError.badRequest("Invalid Google token payload");
    }
    return payload;
};
export const findOrCreateGoogleUser = async (payload) => {
    const { sub: googleId, email, name, picture } = payload;
    let user = await findUserByGoogleId(googleId);
    if (!user) {
        const byEmail = email ? await findUserByEmail(email) : null;
        if (byEmail) {
            if (byEmail.provider !== "google") {
                throw ApiError.conflict("An account with this email already exists. Please sign in with your password.");
            }
            user = byEmail;
        }
        else {
            user =
                (await insertUser({
                    name: name ?? "Unknown",
                    email: email ?? "",
                    avatarUrl: picture ?? null,
                    provider: "google",
                    providerId: googleId,
                })) ?? null;
            if (user)
                await createDefaultSettings(user.id);
        }
    }
    const { accessToken, refreshToken } = await generateTokens(user);
    return { user, accessToken, refreshToken };
};
//# sourceMappingURL=auth.services.js.map