import jwt, { type JwtPayload } from "jsonwebtoken";

interface jwtPaylodCustom extends JwtPayload {
  userId: string;
}

export const generateToken = (id: string): string =>
  jwt.sign({ userId: id }, process.env.JWT_SECRET!, {
    expiresIn: 900,
    issuer: "SayDo",
  });

export const generateRefreshToken = (id: string): string =>
  jwt.sign({ userId: id }, process.env.REFRESH_SECRET!, {
    expiresIn: 604800,
    issuer: "SayDo",
  });

export const verifyToken = (token: string): jwtPaylodCustom =>
  jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: "SayDo",
  }) as jwtPaylodCustom;

export const verifyRefreshToken = (token: string): jwtPaylodCustom =>
  jwt.verify(token, process.env.REFRESH_SECRET!, {
    issuer: "SayDo",
  }) as jwtPaylodCustom;
