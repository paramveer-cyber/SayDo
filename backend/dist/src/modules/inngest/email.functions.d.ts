import type { InngestFunction } from "inngest";
import { corsair } from "../../corsair.js";
export declare const GMAIL_LABEL_NAME_FOR_PRIORITY: Record<string, string>;
export declare const getExistingPriorityLabelIds: (tenantCorsair: ReturnType<typeof corsair.withTenant>) => Promise<Set<string>>;
export declare const onEmailReceivedAssignPriority: InngestFunction.Any;
export declare const onWeeklyDigestRequested: InngestFunction.Any;
export declare const onDailyDigestRequested: InngestFunction.Any;
export declare const onUnsubscribeSuggestionsRequested: InngestFunction.Any;
export declare const onFollowupScanRequested: InngestFunction.Any;
export declare const onBulkCleanupRequested: InngestFunction.Any;
export declare const onWeekPrepBriefingRequested: InngestFunction.Any;
export declare const onConflictDetectionRequested: InngestFunction.Any;
//# sourceMappingURL=email.functions.d.ts.map