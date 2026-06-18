import { inngest } from "../../common/config/inngest.client.js";
import { corsair } from "../../corsair.js";
import { findUserById, findSettingsByUserId } from "../auth/auth.queries.js";
import { buildRawEmailBase64 } from "../gmail/gmail.services.js";
import { BULK_CLEANUP_SYSTEM_PROMPT, CONFLICT_DETECTOR_SYSTEM_PROMPT, DAILY_DIGEST_SYSTEM_PROMPT, EMAIL_PRIORITY_CLASSIFIER_SYSTEM_PROMPT, FOLLOWUP_SCANNER_SYSTEM_PROMPT, UNSUBSCRIBE_SUGGESTIONS_SYSTEM_PROMPT, WEEK_PREP_SYSTEM_PROMPT, WEEKLY_DIGEST_SYSTEM_PROMPT, } from "./system.prompts.js";
import { generateText } from "ai";
import { resolveDefaultModel } from "../../common/utils/aiProvider.js";
import { canAccessWorkflow } from "../../common/utils/rbac.js";
export const GMAIL_LABEL_NAME_FOR_PRIORITY = {
    HIGH: "Priority/High",
    MEDIUM: "Priority/Medium",
    LOW: "Priority/Low",
};
export const getExistingPriorityLabelIds = async (tenantCorsair) => {
    const ids = new Set();
    for (const labelName of Object.values(GMAIL_LABEL_NAME_FOR_PRIORITY)) {
        const existingLabels = await tenantCorsair.gmail.db.labels.search({
            data: { name: { contains: labelName } },
            limit: 1,
            offset: 0,
        });
        const label = existingLabels[0]?.data;
        if (label?.id)
            ids.add(label.id);
    }
    return ids;
};
const resolveModelForTenant = async (tenantId) => {
    const settings = await findSettingsByUserId(tenantId);
    return resolveDefaultModel(settings?.geminiApiKey);
};
const assertTenantWorkflowAccess = async (tenantId, workflowId) => {
    const user = await findUserById(tenantId);
    const role = (user?.role ?? "user");
    if (!canAccessWorkflow(role, workflowId)) {
        throw new Error(`User role '${role}' does not have access to workflow '${workflowId}'`);
    }
};
export const onEmailReceivedAssignPriority = inngest.createFunction({
    id: "on-email-received-assign-priority",
    retries: 3,
    triggers: [{ event: "email/received" }],
}, async ({ event, step }) => {
    const { messageId, tenantId, from, subject, snippet, body, labelIds } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "email-priority"));
    const classificationResult = await step.run("classify-email-priority-with-ai", async () => {
        const model = await resolveModelForTenant(tenantId);
        const emailContext = `
From: ${from}
Subject: ${subject}
Snippet: ${snippet}
Label IDs: ${labelIds.join(", ")}
Body (first 1000 chars): ${body?.slice(0, 1000) ?? ""}
`.trim();
        const { text } = await generateText({
            model,
            system: EMAIL_PRIORITY_CLASSIFIER_SYSTEM_PROMPT,
            prompt: `Classify this email:\n\n${emailContext}`,
        });
        const cleanedText = text.replace(/```json|```/g, "").trim();
        try {
            const parsed = JSON.parse(cleanedText);
            return parsed;
        }
        catch {
            return { priority: "LOW", reason: "parse-error" };
        }
    });
    const priorityLabelName = GMAIL_LABEL_NAME_FOR_PRIORITY[classificationResult.priority];
    const existingLabel = await step.run("find-or-create-priority-label-in-gmail", async () => {
        const tenantCorsair = corsair.withTenant(tenantId);
        const findLiveLabel = async () => {
            const liveLabels = await tenantCorsair.gmail.api.labels.list();
            const labelList = Array.isArray(liveLabels)
                ? liveLabels
                : (liveLabels.labels ?? []);
            return labelList.find((label) => label.name === priorityLabelName);
        };
        const existingLabels = await tenantCorsair.gmail.db.labels.search({
            data: { name: { contains: priorityLabelName } },
            limit: 1,
            offset: 0,
        });
        if (existingLabels.length > 0 && existingLabels[0]) {
            return existingLabels[0].data;
        }
        const liveLabel = await findLiveLabel();
        if (liveLabel)
            return liveLabel;
        try {
            const createdLabel = await tenantCorsair.gmail.api.labels.create({
                label: {
                    name: priorityLabelName,
                    labelListVisibility: "labelShow",
                    messageListVisibility: "show",
                },
            });
            return createdLabel;
        }
        catch (err) {
            const isConflict = err.status === 409;
            if (!isConflict)
                throw err;
            const recoveredLabel = await findLiveLabel();
            if (recoveredLabel)
                return recoveredLabel;
            throw err;
        }
    });
    await step.run("apply-priority-label-to-message", async () => {
        const tenantCorsair = corsair.withTenant(tenantId);
        await tenantCorsair.gmail.api.messages.modify({
            id: messageId,
            addLabelIds: [existingLabel.id],
        });
        return {
            messageId,
            appliedLabel: priorityLabelName,
            reason: classificationResult.reason,
        };
    });
    return {
        messageId,
        priority: classificationResult.priority,
        reason: classificationResult.reason,
        labelApplied: priorityLabelName,
    };
});
const fetchRecentMessages = async (tenantId, sinceMs) => {
    const tenantCorsair = corsair.withTenant(tenantId);
    const rows = await tenantCorsair.gmail.db.messages.search({
        data: { labelIds: { contains: "INBOX" } },
        limit: 500,
        offset: 0,
    });
    const now = Date.now();
    return rows
        .map((row) => row.data)
        .filter((message) => {
        const internalDate = Number(message.internalDate);
        if (!Number.isFinite(internalDate))
            return true;
        return now - internalDate <= sinceMs;
    });
};
const sendDigestEmail = async (tenantId, toEmail, subject, body) => {
    const tenantCorsair = corsair.withTenant(tenantId);
    await tenantCorsair.gmail.api.messages.send({
        raw: buildRawEmailBase64({
            to: toEmail,
            subject,
            body,
        }),
    });
};
export const onWeeklyDigestRequested = inngest.createFunction({
    id: "on-weekly-digest-requested",
    retries: 2,
    triggers: [{ event: "digest/weekly.requested" }],
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "weekly-digest"));
    const messages = await step.run("fetch-last-7-days-messages", () => fetchRecentMessages(tenantId, 7 * 24 * 60 * 60 * 1000));
    const digestText = await step.run("generate-weekly-digest", async () => {
        const model = await resolveModelForTenant(tenantId);
        const trimmed = messages.slice(0, 200).map((m) => ({
            from: m.from,
            subject: m.subject,
            snippet: m.snippet,
            labelIds: m.labelIds,
        }));
        const { text } = await generateText({
            model,
            system: WEEKLY_DIGEST_SYSTEM_PROMPT,
            prompt: `Here are the emails from the last 7 days as JSON:\n\n${JSON.stringify(trimmed)}`,
        });
        return text.trim();
    });
    await step.run("send-weekly-digest-email", async () => {
        const user = await findUserById(tenantId);
        if (!user?.email)
            return { sent: false, reason: "no-user-email" };
        await sendDigestEmail(tenantId, user.email, "Your weekly inbox digest", digestText);
        return { sent: true };
    });
    return { tenantId, messageCount: messages.length, digestText };
});
export const onDailyDigestRequested = inngest.createFunction({
    id: "on-daily-digest-requested",
    retries: 2,
    triggers: [{ event: "digest/daily.requested" }],
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "daily-digest"));
    const messages = await step.run("fetch-last-24h-messages", () => fetchRecentMessages(tenantId, 24 * 60 * 60 * 1000));
    const digestText = await step.run("generate-daily-digest", async () => {
        const model = await resolveModelForTenant(tenantId);
        const trimmed = messages.slice(0, 100).map((m) => ({
            from: m.from,
            subject: m.subject,
            snippet: m.snippet,
            labelIds: m.labelIds,
        }));
        const { text } = await generateText({
            model,
            system: DAILY_DIGEST_SYSTEM_PROMPT,
            prompt: `Here are the emails from the last 24 hours as JSON:\n\n${JSON.stringify(trimmed)}`,
        });
        return text.trim();
    });
    await step.run("send-daily-digest-email", async () => {
        const user = await findUserById(tenantId);
        if (!user?.email)
            return { sent: false, reason: "no-user-email" };
        await sendDigestEmail(tenantId, user.email, "Your daily inbox digest", digestText);
        return { sent: true };
    });
    return { tenantId, messageCount: messages.length, digestText };
});
export const onUnsubscribeSuggestionsRequested = inngest.createFunction({
    id: "on-unsubscribe-suggestions-requested",
    retries: 2,
    triggers: [{ event: "digest/unsubscribe.requested" }],
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "unsubscribe-suggestions"));
    const messages = await step.run("fetch-last-30-days-messages", () => fetchRecentMessages(tenantId, 30 * 24 * 60 * 60 * 1000));
    const senderCounts = await step.run("aggregate-sender-counts", () => {
        const counts = new Map();
        for (const message of messages) {
            if (!message.from)
                continue;
            counts.set(message.from, (counts.get(message.from) ?? 0) + 1);
        }
        return Array.from(counts.entries())
            .filter(([, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(([from, count]) => ({ from, count }));
    });
    const digestText = await step.run("generate-unsubscribe-suggestions", async () => {
        const model = await resolveModelForTenant(tenantId);
        const sampleBySender = new Map();
        for (const message of messages) {
            if (message.from && !sampleBySender.has(message.from)) {
                sampleBySender.set(message.from, message);
            }
        }
        const candidates = senderCounts.map(({ from, count }) => {
            const sample = sampleBySender.get(from);
            return {
                from,
                count,
                sampleSubject: sample?.subject,
                sampleSnippet: sample?.snippet,
                labelIds: sample?.labelIds,
            };
        });
        const { text } = await generateText({
            model,
            system: UNSUBSCRIBE_SUGGESTIONS_SYSTEM_PROMPT,
            prompt: `Here are the recurring senders from the last 30 days as JSON:\n\n${JSON.stringify(candidates)}`,
        });
        return text.trim();
    });
    await step.run("send-unsubscribe-suggestions-email", async () => {
        const user = await findUserById(tenantId);
        if (!user?.email)
            return { sent: false, reason: "no-user-email" };
        await sendDigestEmail(tenantId, user.email, "Inbox cleanup: senders you might want to unsubscribe from", digestText);
        return { sent: true };
    });
    return { tenantId, senderCount: senderCounts.length, digestText };
});
export const onFollowupScanRequested = inngest.createFunction({
    id: "on-followup-scan-requested",
    retries: 2,
    triggers: [{ event: "digest/followup-scan.requested" }],
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "followup-scan"));
    const sentMessages = await step.run("fetch-sent-messages-14d", async () => {
        const tenantCorsair = corsair.withTenant(tenantId);
        const rows = await tenantCorsair.gmail.db.messages.search({
            data: { labelIds: { contains: "SENT" } },
            limit: 200,
            offset: 0,
        });
        const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
        return rows
            .map((row) => row.data)
            .filter((msg) => {
            const date = Number(msg.internalDate);
            return Number.isFinite(date) && date >= cutoff;
        });
    });
    const digestText = await step.run("generate-followup-report", async () => {
        const model = await resolveModelForTenant(tenantId);
        const trimmed = sentMessages.slice(0, 150).map((m) => ({
            subject: m.subject,
            snippet: m.snippet,
            internalDate: m.internalDate,
            labelIds: m.labelIds,
        }));
        const { text } = await generateText({
            model,
            system: FOLLOWUP_SCANNER_SYSTEM_PROMPT,
            prompt: `Here are the sent emails from the last 14 days:\n\n${JSON.stringify(trimmed)}`,
        });
        return text.trim();
    });
    await step.run("send-followup-report-email", async () => {
        const user = await findUserById(tenantId);
        if (!user?.email)
            return { sent: false, reason: "no-user-email" };
        await sendDigestEmail(tenantId, user.email, "Follow-up reminder: emails awaiting a reply", digestText);
        return { sent: true };
    });
    return { tenantId, sentCount: sentMessages.length, digestText };
});
export const onBulkCleanupRequested = inngest.createFunction({
    id: "on-bulk-cleanup-requested",
    retries: 2,
    triggers: [{ event: "digest/bulk-cleanup.requested" }],
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "bulk-cleanup"));
    const messages = await step.run("fetch-30d-inbox-for-cleanup", () => fetchRecentMessages(tenantId, 30 * 24 * 60 * 60 * 1000));
    const senderGroups = await step.run("aggregate-cleanup-candidates", () => {
        const counts = new Map();
        for (const msg of messages) {
            if (!msg.from)
                continue;
            const existing = counts.get(msg.from);
            const resolvedSubject = existing !== undefined ? existing.sampleSubject : msg.subject;
            counts.set(msg.from, {
                count: (existing !== undefined ? existing.count : 0) + 1,
                sampleSubject: resolvedSubject,
            });
        }
        return Array.from(counts.entries())
            .filter(([, val]) => val.count >= 3)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 60)
            .map(([from, val]) => ({
            from,
            count: val.count,
            sampleSubject: val.sampleSubject,
        }));
    });
    const digestText = await step.run("generate-bulk-cleanup-report", async () => {
        const model = await resolveModelForTenant(tenantId);
        const { text } = await generateText({
            model,
            system: BULK_CLEANUP_SYSTEM_PROMPT,
            prompt: `Total emails reviewed: ${messages.length}\n\nFrequent senders (3+ emails):\n${JSON.stringify(senderGroups)}`,
        });
        return text.trim();
    });
    await step.run("send-bulk-cleanup-report", async () => {
        const user = await findUserById(tenantId);
        if (!user?.email)
            return { sent: false, reason: "no-user-email" };
        await sendDigestEmail(tenantId, user.email, "Inbox bulk cleanup suggestions", digestText);
        return { sent: true };
    });
    return {
        tenantId,
        totalMessages: messages.length,
        groupCount: senderGroups.length,
        digestText,
    };
});
export const onWeekPrepBriefingRequested = inngest.createFunction({
    id: "on-week-prep-briefing-requested",
    retries: 2,
    triggers: [{ event: "calendar/week-prep.requested" }],
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "week-prep-briefing"));
    const calendarEvents = await step.run("fetch-week-calendar-events", async () => {
        const tenantCorsair = corsair.withTenant(tenantId);
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const result = await tenantCorsair.googlecalendar.api.events.getMany({
            calendarId: "primary",
            timeMin: now.toISOString(),
            timeMax: weekLater.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 100,
        });
        return result?.items ?? [];
    });
    const digestText = await step.run("generate-week-prep-briefing", async () => {
        const model = await resolveModelForTenant(tenantId);
        const trimmed = calendarEvents
            .slice(0, 80)
            .map((e) => ({
            summary: e.summary,
            start: e.start,
            end: e.end,
            attendees: Array.isArray(e.attendees) ? e.attendees.length : 0,
            description: typeof e.description === "string"
                ? e.description.slice(0, 200)
                : undefined,
            location: e.location,
        }));
        const { text } = await generateText({
            model,
            system: WEEK_PREP_SYSTEM_PROMPT,
            prompt: `Calendar events for the next 7 days:\n\n${JSON.stringify(trimmed)}`,
        });
        return text.trim();
    });
    await step.run("send-week-prep-briefing-email", async () => {
        const user = await findUserById(tenantId);
        if (!user?.email)
            return { sent: false, reason: "no-user-email" };
        await sendDigestEmail(tenantId, user.email, "Your week ahead: calendar briefing", digestText);
        return { sent: true };
    });
    return { tenantId, eventCount: calendarEvents.length, digestText };
});
export const onConflictDetectionRequested = inngest.createFunction({
    id: "on-conflict-detection-requested",
    retries: 2,
    triggers: [{ event: "calendar/conflict-detection.requested" }],
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "conflict-detection"));
    const calendarEvents = await step.run("fetch-week-events-for-conflicts", async () => {
        const tenantCorsair = corsair.withTenant(tenantId);
        const now = new Date();
        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const result = await tenantCorsair.googlecalendar.api.events.getMany({
            calendarId: "primary",
            timeMin: now.toISOString(),
            timeMax: weekLater.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 100,
        });
        return result?.items ?? [];
    });
    const digestText = await step.run("generate-conflict-report", async () => {
        const model = await resolveModelForTenant(tenantId);
        const trimmed = calendarEvents.map((e) => ({
            summary: e.summary,
            start: e.start,
            end: e.end,
            attendees: Array.isArray(e.attendees) ? e.attendees.length : 0,
        }));
        const { text } = await generateText({
            model,
            system: CONFLICT_DETECTOR_SYSTEM_PROMPT,
            prompt: `Calendar events for the next 7 days:\n\n${JSON.stringify(trimmed)}`,
        });
        return text.trim();
    });
    await step.run("send-conflict-report-email", async () => {
        const user = await findUserById(tenantId);
        if (!user?.email)
            return { sent: false, reason: "no-user-email" };
        await sendDigestEmail(tenantId, user.email, "Calendar conflict report for the week ahead", digestText);
        return { sent: true };
    });
    return { tenantId, eventCount: calendarEvents.length, digestText };
});
export const onBulkPrioritizeWeekRequested = inngest.createFunction({
    id: "on-bulk-prioritize-week-requested",
    retries: 2,
    triggers: [{ event: "digest/bulk-prioritize-week.requested" }],
    concurrency: { limit: 1, key: "event.data.tenantId" },
}, async ({ event, step }) => {
    const { tenantId } = event.data;
    await step.run("check-workflow-access", () => assertTenantWorkflowAccess(tenantId, "bulk-prioritize-week"));
    const recentMessages = (await step.run("fetch-last-7-days-messages", async () => {
        const tenantCorsair = corsair.withTenant(tenantId);
        const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const rows = await tenantCorsair.gmail.db.messages.search({
            data: { labelIds: { contains: "INBOX" } },
            limit: 500,
            offset: 0,
        });
        const existingPriorityLabelIds = await getExistingPriorityLabelIds(tenantCorsair);
        return rows
            .map((row) => row.data)
            .filter((message) => {
            const internalDate = Number(message.internalDate);
            if (!Number.isFinite(internalDate))
                return false;
            if (Date.now() - internalDate > sevenDaysAgoMs)
                return false;
            const labelIds = Array.isArray(message.labelIds)
                ? message.labelIds
                : [];
            return !labelIds.some((labelId) => existingPriorityLabelIds.has(labelId));
        })
            .map((message) => ({
            messageId: message.id,
            from: message.from ?? "",
            subject: message.subject ?? "",
            snippet: message.snippet ?? "",
            body: message.body ?? "",
            labelIds: Array.isArray(message.labelIds)
                ? message.labelIds
                : [],
        }));
    }));
    await step.run("fire-priority-events-for-each-message", async () => {
        await Promise.all(recentMessages.map((message) => inngest.send({
            name: "email/received",
            data: {
                tenantId,
                messageId: message.messageId,
                from: message.from,
                subject: message.subject,
                snippet: message.snippet,
                body: message.body,
                labelIds: message.labelIds,
            },
        })));
        return { fired: recentMessages.length };
    });
    return { tenantId, queuedForPrioritization: recentMessages.length };
});
//# sourceMappingURL=email.functions.js.map