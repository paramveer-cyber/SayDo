import type { Request, Response, NextFunction } from "express";
import { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import {
  getEmailsNeedingAttention,
  getMeetingsToday,
  detectScheduleConflicts,
  getFollowUpsDue,
} from "./command-center.services.js";
import type { CommandCenterOverview } from "./command-center.types.js";

const EMAILS_NEEDING_ATTENTION_LIMIT = 5;
const FOLLOW_UPS_DUE_LIMIT = 5;

const resolveTodayBounds = (
  timeMin: unknown,
  timeMax: unknown,
): { dayStartIso: string; dayEndIso: string } => {
  if (typeof timeMin === "string" && typeof timeMax === "string") {
    return { dayStartIso: timeMin, dayEndIso: timeMax };
  }

  const now = new Date();
  const dayStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
  const dayEndIso = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
    ),
  ).toISOString();

  return { dayStartIso, dayEndIso };
};

export class CommandCenterController {
  private getTenant(req: Request) {
    return getTenantCorsair(req.user);
  }

  getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantCorsair = this.getTenant(req);
      const { dayStartIso, dayEndIso } = resolveTodayBounds(
        req.query.timeMin,
        req.query.timeMax,
      );

      const [emailsNeedingAttention, meetingsToday, followUpsDue] =
        await Promise.all([
          getEmailsNeedingAttention(
            tenantCorsair,
            EMAILS_NEEDING_ATTENTION_LIMIT,
          ),
          getMeetingsToday(tenantCorsair, dayStartIso, dayEndIso),
          getFollowUpsDue(tenantCorsair, FOLLOW_UPS_DUE_LIMIT),
        ]);

      const conflictsDetected = detectScheduleConflicts(meetingsToday);

      const overview: CommandCenterOverview = {
        emailsNeedingAttention,
        meetingsToday,
        conflictsDetected,
        followUpsDue,
        generatedAt: new Date().toISOString(),
      };

      return res.status(200).json(overview);
    } catch (err) {
      next(err);
    }
  };
}
