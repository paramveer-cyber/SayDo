export declare const generateTokens: (user: {
    id: string;
    email: string;
}) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare const registerLocalUser: ({ name, email, password, }: {
    name: string;
    email: string;
    password: string;
}) => Promise<{
    user: {
        password: string | null;
        id: string;
        provider: "local" | "google";
        email: string;
        name: string;
        avatarUrl: string | null;
        salt: string | null;
        providerId: string | null;
        refreshToken: string | null;
        createdAt: Date;
    } | undefined;
    accessToken: string;
    refreshToken: string;
}>;
export declare const loginLocalUser: ({ email, password, }: {
    email: string;
    password: string;
}) => Promise<{
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        salt: string | null;
        password: string | null;
        provider: "local" | "google";
        providerId: string | null;
        refreshToken: string | null;
        createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}>;
export declare const verifyGoogleToken: (idToken: string) => Promise<import("google-auth-library").TokenPayload>;
export declare const findOrCreateGoogleUser: (payload: {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
}) => Promise<{
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        salt: string | null;
        password: string | null;
        provider: "local" | "google";
        providerId: string | null;
        refreshToken: string | null;
        createdAt: Date;
    } | null;
    accessToken: string;
    refreshToken: string;
}>;
//# sourceMappingURL=auth.services.d.ts.map