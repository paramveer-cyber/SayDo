import { sql, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
export const getUserConnections = async (userId) => {
    const [row] = await db
        .select({ connections: users.connections })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
    return row?.connections ?? {};
};
export const setUserConnection = (userId, plugin, connection) => db
    .update(users)
    .set({
    connections: sql `jsonb_set(${users.connections}, ${`{${plugin}}`}::text[], ${JSON.stringify(connection)}::jsonb, true)`,
})
    .where(eq(users.id, userId));
export const removeUserConnection = (userId, plugin) => db
    .update(users)
    .set({
    connections: sql `(${users.connections} - ${plugin})`,
})
    .where(eq(users.id, userId));
//# sourceMappingURL=connections.queries.js.map