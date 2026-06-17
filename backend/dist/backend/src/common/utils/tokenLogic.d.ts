import { type JwtPayload } from "jsonwebtoken";
interface jwtPaylodCustom extends JwtPayload {
    userId: string;
}
export declare const generateToken: (id: string, email: string) => string;
export declare const generateRefreshToken: (id: string) => string;
export declare const verifyToken: (token: string) => jwtPaylodCustom;
export declare const verifyRefreshToken: (token: string) => jwtPaylodCustom;
export {};
//# sourceMappingURL=tokenLogic.d.ts.map