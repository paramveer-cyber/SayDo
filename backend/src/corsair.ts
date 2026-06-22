import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from "./db/index.js";
import { inngest } from "./common/config/inngest.client.js";
import { sendEventToUser } from "./modules/sse/sse.service.js";
import { findUserById } from "./modules/auth/auth.queries.js";
import { getExistingPriorityLabelIds } from "./modules/inngest/email.functions.js";
import { canAccessWorkflow } from "./common/utils/rbac.js";
import type { UserRole } from "./common/utils/rbac.js";

type GmailMessageChangedResponse = {
  success: boolean;
  data?: {
    type?: string;
    message?: {
      id?: string;
      labelIds?: string[];
      from?: string;
      subject?: string;
      snippet?: string;
      body?: string;
      internalDate?: string;
    };
  };
};

export const corsair = createCorsair({
  plugins: [
    gmail({
      authType: "oauth_2",
      webhookHooks: {
        messageChanged: {
          after: async (ctx, response) => {
            const tenantId = ctx.tenantId;
            if (!tenantId) return;

            const typedResponse = response as GmailMessageChangedResponse;
            if (!typedResponse.success || !typedResponse.data) return;

            const message = typedResponse.data.message;
            if (!message?.id) return;

            const user = await findUserById(tenantId);
            const userRole = (user?.role ?? "user") as UserRole;
            if (!canAccessWorkflow(userRole, "email-priority")) return;

            const tenantCorsair = corsair.withTenant(tenantId);

            const priorityLabelIds =
              await getExistingPriorityLabelIds(tenantCorsair);
            const alreadyPrioritized = (message.labelIds ?? []).some(
              (labelId) => priorityLabelIds.has(labelId),
            );
            if (alreadyPrioritized) return;

            console.info(`email priority job dispatched: ${message.id}`);

            sendEventToUser(tenantId, "new_email", {
              messageId: message.id,
              from: message.from ?? "",
              subject: message.subject ?? "",
              snippet: message.snippet ?? "",
            });

            await inngest.send({
              name: "email/received",
              data: {
                messageId: message.id,
                tenantId,
                from: message.from ?? "",
                subject: message.subject ?? "",
                snippet: message.snippet ?? "",
                body: message.body ?? "",
                labelIds: message.labelIds ?? [],
              },
            });
          },
        },
      },
    }),
    googlecalendar({
      authType: "oauth_2",
    }),
  ],
  database: pool,
  kek: process.env.CORSAIR_KEK!,
  multiTenancy: true,
});
