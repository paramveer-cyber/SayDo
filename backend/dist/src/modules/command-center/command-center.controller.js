import { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import { getEmailsNeedingAttention, getMeetingsToday, detectScheduleConflicts, getFollowUpsDue, } from "./command-center.services.js";
const EMAILS_NEEDING_ATTENTION_LIMIT = 5;
const FOLLOW_UPS_DUE_LIMIT = 5;
const resolveTodayBounds = (timeMin, timeMax) => {
    if (typeof timeMin === "string" && typeof timeMax === "string") {
        return { dayStartIso: timeMin, dayEndIso: timeMax };
    }
    const now = new Date();
    const dayStartIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const dayEndIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)).toISOString();
    return { dayStartIso, dayEndIso };
};
export class CommandCenterController {
    getTenant(req) {
        return getTenantCorsair(req.user);
    }
    getOverview = async (req, res, next) => {
        try {
            const tenantCorsair = this.getTenant(req);
            const { dayStartIso, dayEndIso } = resolveTodayBounds(req.query.timeMin, req.query.timeMax);
            const [emailsNeedingAttention, meetingsToday, followUpsDue] = await Promise.all([
                getEmailsNeedingAttention(tenantCorsair, EMAILS_NEEDING_ATTENTION_LIMIT),
                getMeetingsToday(tenantCorsair, dayStartIso, dayEndIso),
                getFollowUpsDue(tenantCorsair, FOLLOW_UPS_DUE_LIMIT),
            ]);
            const conflictsDetected = detectScheduleConflicts(meetingsToday);
            const overview = {
                emailsNeedingAttention,
                meetingsToday,
                conflictsDetected,
                followUpsDue,
                generatedAt: new Date().toISOString(),
            };
            return res.status(200).json(overview);
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=command-center.controller.js.map