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
        provider: "local" | "google";
        role: "user" | "bronze_subscriber" | "silver_subscriber" | "gold_subscriber" | "admin";
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        salt: string | null;
        password: string | null;
        providerId: string | null;
        refreshToken: string | null;
        plugins: Record<string, boolean>;
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
        role: "user" | "bronze_subscriber" | "silver_subscriber" | "gold_subscriber" | "admin";
        plugins: Record<string, boolean>;
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
        role: "user" | "bronze_subscriber" | "silver_subscriber" | "gold_subscriber" | "admin";
        plugins: Record<string, boolean>;
        createdAt: Date;
    } | null;
    accessToken: string;
    refreshToken: string;
}>;
//# sourceMappingURL=auth.services.d.ts.map