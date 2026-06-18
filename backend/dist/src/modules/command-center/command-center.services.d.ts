import type { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import type { EmailNeedingAttention, MeetingToday, ConflictDetected, FollowUpDue } from "./command-center.types.js";
type TenantCorsair = ReturnType<typeof getTenantCorsair>;
export declare const getEmailsNeedingAttention: (tenantCorsair: TenantCorsair, limit: number) => Promise<EmailNeedingAttention[]>;
export declare const getMeetingsToday: (tenantCorsair: TenantCorsair, dayStartIso: string, dayEndIso: string) => Promise<MeetingToday[]>;
export declare const detectScheduleConflicts: (meetingsToday: MeetingToday[]) => ConflictDetected[];
export declare const getFollowUpsDue: (tenantCorsair: TenantCorsair, limit: number) => Promise<FollowUpDue[]>;
export {};
//# sourceMappingURL=command-center.services.d.ts.map