import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from "./db/index.js";

export const corsair = createCorsair({
  plugins: [
    gmail({
      authType: "oauth_2",
    }),
    googlecalendar({
      authType: "oauth_2",
    }),
  ],
  database: pool,
  kek: process.env.CORSAIR_KEK!,
  multiTenancy: true,
});
