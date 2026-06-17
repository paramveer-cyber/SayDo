import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, } from "drizzle-orm/pg-core";
export const providerEnum = pgEnum("provider", ["local", "google"]);
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    avatarUrl: text("avatar_url"),
    salt: text("password_salt"),
    password: text("password_hash"),
    provider: providerEnum("provider").notNull().default("local"),
    providerId: varchar("provider_id", { length: 255 }),
    refreshToken: text("refresh_token"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});
export const corsairIntegrations = pgTable("corsair_integrations", {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    name: text("name").notNull(),
    config: jsonb("config").notNull().default({}),
    dek: text("dek"),
});
export const corsairAccounts = pgTable("corsair_accounts", {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    tenantId: text("tenant_id").notNull(),
    integrationId: text("integration_id")
        .notNull()
        .references(() => corsairIntegrations.id),
    config: jsonb("config").notNull().default({}),
    dek: text("dek"),
});
export const corsairEntities = pgTable("corsair_entities", {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    accountId: text("account_id")
        .notNull()
        .references(() => corsairAccounts.id),
    entityId: text("entity_id").notNull(),
    entityType: text("entity_type").notNull(),
    version: text("version").notNull(),
    data: jsonb("data").notNull().default({}),
});
export const corsairEvents = pgTable("corsair_events", {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    accountId: text("account_id")
        .notNull()
        .references(() => corsairAccounts.id),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    status: text("status"),
});
//# sourceMappingURL=schema.js.map