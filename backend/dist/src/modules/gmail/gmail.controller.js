import * as gmailServices from "./gmail.services.js";
import { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import { inngest } from "../../common/config/inngest.client.js";
import { ApiError } from "../../common/utils/api-error.js";
import { ok } from "../../common/utils/response.js";
import { canAccessWorkflow } from "../../common/utils/rbac.js";
const WORKFLOW_TO_INNGEST_EVENT = {
    "weekly-digest": "digest/weekly.requested",
    "daily-digest": "digest/daily.requested",
    "unsubscribe-suggestions": "digest/unsubscribe.requested",
    "followup-scan": "digest/followup-scan.requested",
    "bulk-cleanup": "digest/bulk-cleanup.requested",
    "week-prep-briefing": "calendar/week-prep.requested",
    "conflict-detection": "calendar/conflict-detection.requested",
    "email-priority": "email/received",
};
export class GmailController {
    getTenant(req) {
        return getTenantCorsair(req.user);
    }
    runWorkflow = async (req, res, next) => {
        try {
            const workflowId = req.params.workflowId;
            const inngestEventName = WORKFLOW_TO_INNGEST_EVENT[workflowId];
            if (!inngestEventName) {
                throw ApiError.badRequest(`Unknown workflow: ${workflowId}`);
            }
            const userRole = (req.userRole ?? "user");
            const userHasAccess = canAccessWorkflow(userRole, workflowId);
            if (!userHasAccess) {
                throw ApiError.forbidden(`Your current plan does not include access to '${workflowId}'. Please upgrade to use this workflow.`);
            }
            await inngest.send({
                name: inngestEventName,
                data: { tenantId: req.user },
            });
            return ok(res, "Workflow triggered. The digest will arrive in your inbox shortly.");
        }
        catch (err) {
            next(err);
        }
    };
    listMessages = async (req, res, next) => {
        try {
            const messages = await gmailServices.listMessages(this.getTenant(req), req.query);
            return res.status(200).json(messages);
        }
        catch (err) {
            next(err);
        }
    };
    syncMessages = async (req, res, next) => {
        try {
            const result = await gmailServices.syncAllMessages(this.getTenant(req), req.query);
            return res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    };
    getMessage = async (req, res, next) => {
        try {
            const message = await gmailServices.getMessage(this.getTenant(req), req.params.messageId);
            return res.status(200).json(message);
        }
        catch (err) {
            next(err);
        }
    };
    sendMessage = async (req, res, next) => {
        try {
            const sent = await gmailServices.sendMessage(this.getTenant(req), req.body);
            return res.status(201).json(sent);
        }
        catch (err) {
            next(err);
        }
    };
    deleteMessage = async (req, res, next) => {
        try {
            await gmailServices.deleteMessage(this.getTenant(req), req.params.messageId);
            return res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    trashMessage = async (req, res, next) => {
        try {
            const message = await gmailServices.trashMessage(this.getTenant(req), req.params.messageId);
            return res.status(200).json(message);
        }
        catch (err) {
            next(err);
        }
    };
    untrashMessage = async (req, res, next) => {
        try {
            const message = await gmailServices.untrashMessage(this.getTenant(req), req.params.messageId);
            return res.status(200).json(message);
        }
        catch (err) {
            next(err);
        }
    };
    modifyMessage = async (req, res, next) => {
        try {
            const message = await gmailServices.modifyMessage(this.getTenant(req), req.params.messageId, req.body);
            return res.status(200).json(message);
        }
        catch (err) {
            next(err);
        }
    };
    batchModifyMessages = async (req, res, next) => {
        try {
            await gmailServices.batchModifyMessages(this.getTenant(req), req.body);
            return res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    listThreads = async (req, res, next) => {
        try {
            const threads = await gmailServices.listThreads(this.getTenant(req), req.query);
            return res.status(200).json(threads);
        }
        catch (err) {
            next(err);
        }
    };
    getThread = async (req, res, next) => {
        try {
            const thread = await gmailServices.getThread(this.getTenant(req), req.params.threadId);
            return res.status(200).json(thread);
        }
        catch (err) {
            next(err);
        }
    };
    modifyThread = async (req, res, next) => {
        try {
            const thread = await gmailServices.modifyThread(this.getTenant(req), req.params.threadId, req.body);
            return res.status(200).json(thread);
        }
        catch (err) {
            next(err);
        }
    };
    trashThread = async (req, res, next) => {
        try {
            const thread = await gmailServices.trashThread(this.getTenant(req), req.params.threadId);
            return res.status(200).json(thread);
        }
        catch (err) {
            next(err);
        }
    };
    untrashThread = async (req, res, next) => {
        try {
            const thread = await gmailServices.untrashThread(this.getTenant(req), req.params.threadId);
            return res.status(200).json(thread);
        }
        catch (err) {
            next(err);
        }
    };
    deleteThread = async (req, res, next) => {
        try {
            await gmailServices.deleteThread(this.getTenant(req), req.params.threadId);
            return res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    listDrafts = async (req, res, next) => {
        try {
            const drafts = await gmailServices.listDrafts(this.getTenant(req), req.query);
            return res.status(200).json(drafts);
        }
        catch (err) {
            next(err);
        }
    };
    getDraft = async (req, res, next) => {
        try {
            const draft = await gmailServices.getDraft(this.getTenant(req), req.params.draftId);
            return res.status(200).json(draft);
        }
        catch (err) {
            next(err);
        }
    };
    createDraft = async (req, res, next) => {
        try {
            const draft = await gmailServices.createDraft(this.getTenant(req), req.body);
            return res.status(201).json(draft);
        }
        catch (err) {
            next(err);
        }
    };
    updateDraft = async (req, res, next) => {
        try {
            const draft = await gmailServices.updateDraft(this.getTenant(req), req.params.draftId, req.body);
            return res.status(200).json(draft);
        }
        catch (err) {
            next(err);
        }
    };
    deleteDraft = async (req, res, next) => {
        try {
            await gmailServices.deleteDraft(this.getTenant(req), req.params.draftId);
            return res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    sendDraft = async (req, res, next) => {
        try {
            const sent = await gmailServices.sendDraft(this.getTenant(req), req.params.draftId);
            return res.status(200).json(sent);
        }
        catch (err) {
            next(err);
        }
    };
    listLabels = async (_req, res, next) => {
        try {
            const raw = await gmailServices.listLabels(this.getTenant(_req));
            const labelArray = Array.isArray(raw)
                ? raw
                : (raw.labels ?? []);
            const labels = labelArray.map((label) => ({
                id: label.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                account_id: "",
                entity_id: label.id,
                entity_type: "labels",
                version: "1",
                data: label,
            }));
            return res.status(200).json(labels);
        }
        catch (err) {
            next(err);
        }
    };
    getLabel = async (req, res, next) => {
        try {
            const label = await gmailServices.getLabel(this.getTenant(req), req.params.labelId);
            return res.status(200).json(label);
        }
        catch (err) {
            next(err);
        }
    };
    createLabel = async (req, res, next) => {
        try {
            const label = await gmailServices.createLabel(this.getTenant(req), req.body);
            return res.status(201).json(label);
        }
        catch (err) {
            next(err);
        }
    };
    deleteLabel = async (req, res, next) => {
        try {
            await gmailServices.deleteLabel(this.getTenant(req), req.params.labelId);
            return res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    };
    updateLabel = async (req, res, next) => {
        try {
            const label = await gmailServices.updateLabel(this.getTenant(req), req.params.labelId, req.body);
            return res.status(200).json(label);
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=gmail.controller.js.map