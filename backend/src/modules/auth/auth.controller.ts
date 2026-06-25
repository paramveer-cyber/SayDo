import type { Request, Response, NextFunction } from "express";
import type { GenerateOAuthUrlOptions } from "corsair/oauth";
import { corsair } from "../../corsair.js";
import { generateOAuthUrl, processOAuthCallback } from "corsair/oauth";
import {
  getTenantCorsair,
  evictTenantFromCache,
} from "../../common/utils/corsair-tenant.js";
import {
  setupGmailWatch,
  stopGmailWatch,
  syncAllMessages,
} from "../gmail/gmail.services.js";
import {
  registerLocalUser,
  loginLocalUser,
  verifyGoogleToken,
  findOrCreateGoogleUser,
} from "./auth.services.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/tokenLogic.js";
import {
  findUserById,
  findUserByRefreshToken,
  setUserRefreshToken,
  deleteUserById,
  rotateRefreshToken,
  setUserPluginConnected,
} from "./auth.queries.js";
import { ApiError } from "../../common/utils/api-error.js";
import { ok, created } from "../../common/utils/response.js";
import { COOKIE_OPTS } from "../../common/config/cookie-opts.js";
import { db } from "../../db/index.js";
import {
  corsairAccounts,
  corsairEntities,
  corsairEvents,
} from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

const formatUser = (u: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  provider: string;
  createdAt: Date;
  role?: string | null;
  plugins?: Record<string, boolean> | null;
}) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatarUrl: u.avatarUrl,
  provider: u.provider,
  createdAt: u.createdAt,
  role: u.role ?? "user",
  plugins: u.plugins ?? {},
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user, accessToken, refreshToken } = await registerLocalUser(
      req.body,
    );
    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    return created(res, "Account created", {
      token: accessToken,
      user: formatUser(user!),
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user, accessToken, refreshToken } = await loginLocalUser(req.body);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    return ok(res, "Login successful", {
      token: accessToken,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = await verifyGoogleToken(req.body.idToken);
    const { user, accessToken, refreshToken } =
      await findOrCreateGoogleUser(payload);
    res.cookie("refreshToken", refreshToken, COOKIE_OPTS);
    return ok(res, "Login successful", {
      token: accessToken,
      user: formatUser(user!),
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMTdkNmY2Ny0yY2ZlLTRmY2EtYmNlNi1jZDdkMGZiM2I0MjAiLCJpYXQiOjE3ODIxNjM3MzEsImV4cCI6MTc4Mjc2ODUzMSwiaXNzIjoiU2F5RG8ifQ.LglznVSof4VJQOk2dRPtJ2nQ_xdwvP9ZhD40EDia_D4";
    if (!token) throw ApiError.unAuthorized("No refresh token");

    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(token) as { userId: string };
    } catch {
      throw ApiError.unAuthorized("Invalid or expired refresh token");
    }

    const user = await findUserById(decoded.userId);
    if (!user) {
      res.clearCookie("refreshToken");
      throw ApiError.unAuthorized("User not found");
    }

    const newRefreshToken = generateRefreshToken(decoded.userId);
    const rotated = await rotateRefreshToken(token, newRefreshToken);
    if (!rotated) {
      res.clearCookie("refreshToken");
      throw ApiError.unAuthorized("Refresh token reuse detected");
    }

    const newAccessToken = generateToken(user.id);
    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTS);
    return ok(res, "Token refreshed", {
      token: newAccessToken,
      user: formatUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await findUserById(req.user as string);
    if (!user) throw ApiError.notFound("User not found");
    return ok(res, "User fetched", { user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) {
      const user = await findUserByRefreshToken(token);
      if (user) await setUserRefreshToken(user.id, null);
    }
    res.clearCookie("refreshToken");
    return ok(res, "Logged out");
  } catch (err) {
    next(err);
  }
};

export const getConnectLink = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { pluginId } = req.query as { pluginId: string };
    if (!pluginId) throw ApiError.badRequest("pluginId query param required");

    const redirectUri = `${process.env.API_URL}/auth/callback`;

    const { url } = await generateOAuthUrl(corsair, pluginId, {
      tenantId: req.user as string,
      redirectUri,
    } as GenerateOAuthUrlOptions);

    return ok(res, "Connect link generated", { url });
  } catch (err) {
    next(err);
  }
};

export const oauthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const redirectUri = `${process.env.API_URL}/auth/callback`;

    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri,
    });

    await setUserPluginConnected(result.tenantId, result.plugin, true);

    if (result.plugin === "gmail") {
      const tenantCorsair = getTenantCorsair(result.tenantId);

      const [existingGmailAccount] = await db
        .select()
        .from(corsairAccounts)
        .where(
          and(
            eq(corsairAccounts.tenantId, result.tenantId),
            eq(corsairAccounts.integrationId, "gmail"),
          ),
        )
        .limit(1);

      if (existingGmailAccount) {
        try {
          await stopGmailWatch(tenantCorsair, result.tenantId);
        } catch (err) {
          // prodn log
          console.error("gmail watch teardown failed:", err);
        }

        await db
          .delete(corsairEvents)
          .where(eq(corsairEvents.accountId, existingGmailAccount.id));
        await db
          .delete(corsairEntities)
          .where(eq(corsairEntities.accountId, existingGmailAccount.id));
        await db
          .delete(corsairAccounts)
          .where(eq(corsairAccounts.id, existingGmailAccount.id));

        evictTenantFromCache(result.tenantId);
      }

      const freshTenantCorsair = getTenantCorsair(result.tenantId);

      syncAllMessages(freshTenantCorsair, {}).catch((err) => {
        // prodn log
        console.error("gmail backfill sync failed:", err);
      });

      setupGmailWatch(freshTenantCorsair, result.tenantId).catch((err) => {
        // prodn log
        console.error("gmail watch setup failed:", err);
      });
    }

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";
    return res.redirect(`${frontendUrl}/dashboard/connect?connected=true`);
  } catch (err) {
    next(err);
  }
};

export const disconnectPlugin = async (
  req: Request<{ pluginId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { pluginId } = req.params;
    const userId = req.user as string;

    const validPluginIds = new Set(["gmail", "googlecalendar"]);
    if (!validPluginIds.has(pluginId)) {
      throw ApiError.badRequest(`Invalid plugin: ${pluginId}`);
    }

    const tenantCorsair = getTenantCorsair(userId);

    if (pluginId === "gmail") {
      try {
        await stopGmailWatch(tenantCorsair, userId);
      } catch (err) {
        // prodn log
        console.error("gmail watch teardown failed:", err);
      }
    }

    try {
      let googleAccessToken: string | null = null;

      if (pluginId === "gmail") {
        googleAccessToken = await tenantCorsair.gmail.keys.get_access_token();
      } else if (pluginId === "googlecalendar") {
        googleAccessToken =
          await tenantCorsair.googlecalendar.keys.get_access_token();
      }

      if (googleAccessToken) {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${googleAccessToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );
      }
    } catch {}

    const [corsairAccountRow] = await db
      .select()
      .from(corsairAccounts)
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairAccounts.integrationId, pluginId),
        ),
      )
      .limit(1);

    if (corsairAccountRow) {
      await db
        .delete(corsairEvents)
        .where(eq(corsairEvents.accountId, corsairAccountRow.id));
      await db
        .delete(corsairEntities)
        .where(eq(corsairEntities.accountId, corsairAccountRow.id));
      await db
        .delete(corsairAccounts)
        .where(eq(corsairAccounts.id, corsairAccountRow.id));
    }

    evictTenantFromCache(userId);

    await setUserPluginConnected(userId, pluginId, false);

    return ok(res, `${pluginId} disconnected successfully`);
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user as string;
    const user = await findUserById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const tenantCorsair = getTenantCorsair(userId);

    const connectedAccounts = await db
      .select()
      .from(corsairAccounts)
      .where(eq(corsairAccounts.tenantId, userId));

    for (const connectedAccount of connectedAccounts) {
      try {
        if (connectedAccount.integrationId === "gmail") {
          await stopGmailWatch(tenantCorsair, userId);
        }

        let googleAccessToken: string | null = null;

        if (connectedAccount.integrationId === "gmail") {
          googleAccessToken = await tenantCorsair.gmail.keys.get_access_token();
        } else if (connectedAccount.integrationId === "googlecalendar") {
          googleAccessToken =
            await tenantCorsair.googlecalendar.keys.get_access_token();
        }

        if (googleAccessToken) {
          await fetch(
            `https://oauth2.googleapis.com/revoke?token=${googleAccessToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            },
          );
        }
      } catch {}

      await db
        .delete(corsairEvents)
        .where(eq(corsairEvents.accountId, connectedAccount.id));
      await db
        .delete(corsairEntities)
        .where(eq(corsairEntities.accountId, connectedAccount.id));
      await db
        .delete(corsairAccounts)
        .where(eq(corsairAccounts.id, connectedAccount.id));
    }

    evictTenantFromCache(userId);

    await deleteUserById(userId);

    res.clearCookie("refreshToken");
    return ok(res, "Account and all connected data deleted");
  } catch (err) {
    next(err);
  }
};
