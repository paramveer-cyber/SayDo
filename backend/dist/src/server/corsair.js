import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createCorsair } from "corsair";
import { github } from "@corsair-dev/github";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
export const corsair = createCorsair({
    plugins: [github(), gmail(), googlecalendar()],
    database: pool,
    kek: process.env.CORSAIR_KEK,
});
//# sourceMappingURL=corsair.js.map