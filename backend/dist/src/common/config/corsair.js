import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from "../../db/index.js";
export const corsair = createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: pool,
    kek: process.env.CORSAIR_KEK,
});
//# sourceMappingURL=corsair.js.map