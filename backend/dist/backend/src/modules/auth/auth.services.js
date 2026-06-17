import { OAuth2Client } from "google-auth-library";
import { randomBytes, createHmac } from "node:crypto";
import { ApiError } from "../../common/utils/api-error.js";
import { generateToken, generateRefreshToken, } from "../../common/utils/tokenLogic.js";
import { findUserByGoogleId, findUserByEmail, insertUser, setUserRefreshToken, } from "./auth.queries.js";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const generateTokens = async (user) => {
    const accessToken = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    await setUserRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
};
export const registerLocalUser = async ({ name, email, password, }) => {
    const existing = await findUserByEmail(email);
    if (existing)
        throw ApiError.conflict("Email already registered");
    const salt = randomBytes(32).toString("hex");
    const hash = createHmac("sha256", salt).update(password).digest("hex");
    const user = await insertUser({
        name,
        email,
        salt,
        password: hash,
        provider: "local",
    });
    const { accessToken, refreshToken } = await generateTokens(user);
    return { user, accessToken, refreshToken };
};
export const loginLocalUser = async ({ email, password, }) => {
    const user = await findUserByEmail(email);
    if (!user || user.provider !== "local" || !user.password || !user.salt) {
        throw ApiError.unAuthorized("Invalid credentials");
    }
    const attemptHash = createHmac("sha256", user.salt)
        .update(password)
        .digest("hex");
    if (attemptHash !== user.password)
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
        }
    }
    const { accessToken, refreshToken } = await generateTokens(user);
    return { user, accessToken, refreshToken };
};
/*
LEARN OAUTH 2 from this docs code:
Auth Types
OAuth 2.0 Authentication
Connect user accounts with OAuth 2.0 flows in Corsair plugins.

OAuth 2.0 lets users authorize your application to act on their behalf. Corsair handles the entire flow — generating authorization URLs, processing callbacks, storing tokens encrypted, and refreshing them automatically when they expire.
 ​
How it works
You register an OAuth app with the service and get a client_id and client_secret
Corsair generates an authorization URL for the user to visit
After the user approves, the service redirects back with an authorization code
Corsair exchanges the code for access and refresh tokens and stores them encrypted
On every API call, Corsair checks token expiry and refreshes automatically
corsair.ts
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";

export const corsair = createCorsair({
    plugins: [gmail({ authType: "oauth_2" })],
    kek: process.env.CORSAIR_KEK!,
});
 ​
Solo setup
Solo mode connects a single account to your application. Use this for scripts, internal tools, or apps that only ever connect one account.
corsair.ts
export const corsair = createCorsair({
    plugins: [gmail({ authType: "oauth_2" })],
    kek: process.env.CORSAIR_KEK!,
});
Store your OAuth app credentials, then start the flow:
pnpm corsair setup --plugin=gmail client_id=your-client-id client_secret=your-client-secret
pnpm corsair auth --plugin=gmail
The CLI prints an authorization URL. Open it in a browser, approve, and tokens are stored automatically.
After that, all API calls use your connected account:
usage.ts
const messages = await corsair.gmail.api.messages.list({ maxResults: 10 });
Tokens are refreshed automatically when they expire — no intervention needed.
 ​
Multi-tenant setup
In multi-tenant mode, each user connects their own account. You need an OAuth callback route in your application that Corsair processes.
corsair.ts
export const corsair = createCorsair({
    multiTenancy: true,
    plugins: [gmail({ authType: "oauth_2" })],
    kek: process.env.CORSAIR_KEK!,
});
 ​
1. Store your OAuth app credentials
Store your client credentials once — these are shared across all tenants:
pnpm corsair setup --plugin=gmail client_id=your-client-id client_secret=your-client-secret
 ​
2. Generate the authorization URL
When a user wants to connect their account, redirect them to the authorization URL:
app/api/connect/route.ts
import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/server/corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REDIRECT_URI = `${process.env.APP_URL}/api/auth`;

export async function GET(request: NextRequest) {
    const tenantId = getUserIdFromSession(request); // your auth logic
    const plugin = new URL(request.url).searchParams.get("plugin")!;

    const { url, state } = await generateOAuthUrl(corsair, plugin, {
        tenantId,
        redirectUri: REDIRECT_URI,
    });

    const response = NextResponse.redirect(url);
    response.cookies.set("oauth_state", state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10,
    });
    return response;
}
 ​
3. Handle the callback
After the user approves, the service redirects to your callback URL. Process it with Corsair:
app/api/auth/route.ts
import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/server/corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REDIRECT_URI = `${process.env.APP_URL}/api/auth`;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
        const response = new NextResponse("Missing code or state.", { status: 400 });
        response.cookies.delete("oauth_state");
        return response;
    }

    const storedState = request.cookies.get("oauth_state")?.value;
    if (!storedState || storedState !== state) {
        const response = new NextResponse("Invalid state.", { status: 400 });
        response.cookies.delete("oauth_state");
        return response;
    }

    try {
        const result = await processOAuthCallback(corsair, { code, state, redirectUri: REDIRECT_URI });
        const response = NextResponse.redirect("/dashboard?connected=" + result.plugin);
        response.cookies.delete("oauth_state");
        return response;
    } catch {
        const response = new NextResponse("OAuth failed.", { status: 500 });
        response.cookies.delete("oauth_state");
        return response;
    }
}
Corsair extracts the tenantId from the HMAC-signed state, exchanges the code for tokens, and stores them encrypted for that tenant.
See Production: OAuth Process for a full implementation with security best practices — authenticated routes, cookie hardening, CSRF protection, and HTML escaping.
 ​
4. Make API calls per tenant
usage.ts
const tenant = corsair.withTenant("user_abc123");

// Uses user_abc123's connected account
const messages = await tenant.gmail.api.messages.list({ maxResults: 10 });
 ​
Automatic token refresh
OAuth access tokens expire (typically after 1 hour). Corsair checks token expiry before every API call and refreshes automatically using the stored refresh token. Your code never needs to handle token expiry.
See Authentication for more details.
When using OAuth, tokens expire. Corsair handles this automatically:
Before making a request, checks if the token is expired
If expired, uses the refresh token to get a new access token
Stores the new token and continues with the request
You never have to think about token rotation.
 ​
Envelope Encryption
Corsair uses envelope encryption to protect credentials:
You set one KEK (Key Encryption Key) in your environment variables
Each connection gets its own DEK (Data Encryption Key)
All credentials are encrypted with the connection’s DEK
The DEK is encrypted with your KEK
.env
CORSAIR_KEK=your-key-encryption-key
Each connection has a different DEK, so compromising one connection’s key doesn’t expose others.
 ​
Bring Your Own KMS
If you’re using a Key Management Service (AWS KMS, Google Cloud KMS, etc.), you can opt out of Corsair’s built-in encryption.
corsair.ts
export const corsair = createCorsair({
    plugins: [
        slack({
            authType: "api_key",
            credentials: {
                // Pass your decrypted key directly
                botToken: await kms.decrypt(encryptedToken),
            },
        }),
    ],
});
 ​
Multi-Tenant Credentials
With multi-tenancy, each tenant has their own credentials stored securely.
example.ts
// Tenant A's Slack token
const tenantA = corsair.withTenant("tenant_a");
await tenantA.slack.api.messages.post({ ... });

// Tenant B's Slack token — completely separate
const tenantB = corsair.withTenant("tenant_b");
await tenantB.slack.api.messages.post({ ... });
Corsair retrieves the correct credentials for each tenant automatically
*/
//# sourceMappingURL=auth.services.js.map