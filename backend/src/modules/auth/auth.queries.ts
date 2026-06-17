import { db } from "../../db/index.js";
import { users, userSettings } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";

export const findUserById = (id: string) =>
  db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

export const findUserByEmail = (email: string) =>
  db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0] ?? null);

export const findUserByGoogleId = (googleId: string) =>
  db
    .select()
    .from(users)
    .where(eq(users.providerId, googleId))
    .limit(1)
    .then((r) => r[0] ?? null);

export const findUserByRefreshToken = (token: string) =>
  db
    .select()
    .from(users)
    .where(eq(users.refreshToken, token))
    .limit(1)
    .then((r) => r[0] ?? null);

export const insertUser = async (data: typeof users.$inferInsert) => {
  const [user] = await db.insert(users).values(data).returning();
  return user;
};

export const setUserRefreshToken = (id: string, token: string | null) =>
  db.update(users).set({ refreshToken: token }).where(eq(users.id, id));

export const deleteUserById = (id: string) =>
  db.delete(users).where(eq(users.id, id));

export const rotateRefreshToken = async (
  oldToken: string,
  newToken: string,
) => {
  const result = await db
    .update(users)
    .set({ refreshToken: newToken })
    .where(eq(users.refreshToken, oldToken))
    .returning({ id: users.id });
  return result.length === 1 ? result[0] : null;
};

export const setUserPluginConnected = async (
  userId: string,
  pluginId: string,
  connected: boolean,
) => {
  const [updated] = await db
    .update(users)
    .set({
      plugins: sql`plugins || ${JSON.stringify({ [pluginId]: connected })}::jsonb`,
    })
    .where(eq(users.id, userId))
    .returning();

  return updated ?? null;
};

export const findSettingsByUserId = (userId: string) =>
  db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)
    .then((r) => r[0] ?? null);

export const createDefaultSettings = (userId: string) =>
  db
    .insert(userSettings)
    .values({ userId })
    .onConflictDoNothing()
    .returning()
    .then((r) => r[0] ?? null);

export const updateSettings = (
  userId: string,
  data: Partial<Omit<typeof userSettings.$inferInsert, "id" | "userId" | "createdAt">>,
) =>
  db
    .update(userSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId))
    .returning()
    .then((r) => r[0] ?? null);

export const incrementPromptsAsked = (userId: string) =>
  db
    .update(userSettings)
    .set({ promptsAsked: sql`prompts_asked + 1`, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId));

export const setUserRole = (userId: string, role: "user" | "bronze_subscriber" | "silver_subscriber" | "gold_subscriber") =>
  db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning()
    .then((r) => r[0] ?? null);
