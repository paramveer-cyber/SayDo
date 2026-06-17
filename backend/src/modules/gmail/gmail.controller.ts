import type { Request, Response, NextFunction } from "express";
import * as gmailServices from "./gmail.services.js";
import { getTenantCorsair } from "../../common/utils/corsair-tenant.js";
import { inngest } from "../../common/config/inngest.client.js";
import { ApiError } from "../../common/utils/api-error.js";
import { ok } from "../../common/utils/response.js";
import type {
  ListMessagesQuery,
  GetMessageQuery,
  SendMessageBody,
  ModifyMessageBody,
  BatchModifyMessagesBody,
  ListThreadsQuery,
  GetThreadQuery,
  ModifyThreadBody,
  CreateDraftBody,
  UpdateDraftBody,
  ListDraftsQuery,
  CreateLabelBody,
  UpdateLabelBody,
} from "./gmail.modals.js";
import type {
  GmailLabelData,
  GmailLabelsListApiResponse,
  NormalizedLabel,
} from "./gmail.types.js";

export class GmailController {
  private getTenant(req: Request) {
    return getTenantCorsair(req.user);
  }

  private static readonly WORKFLOW_EVENTS: Record<string, string> = {
    "weekly-digest": "digest/weekly.requested",
    "daily-digest": "digest/daily.requested",
    "unsubscribe-suggestions": "digest/unsubscribe.requested",
    "followup-scan": "digest/followup-scan.requested",
    "week-prep-briefing": "calendar/week-prep.requested",
    "conflict-detector": "calendar/conflict-detection.requested",
  };

  runWorkflow = async (
    req: Request<{ workflowId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const eventName = GmailController.WORKFLOW_EVENTS[req.params.workflowId];

      if (!eventName) {
        throw ApiError.badRequest(`Unknown workflow: ${req.params.workflowId}`);
      }

      await inngest.send({
        name: eventName,
        data: { tenantId: req.user as string },
      });

      return ok(
        res,
        "Workflow triggered. The digest will arrive in your inbox shortly.",
      );
    } catch (err) {
      next(err);
    }
  };

  listMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await gmailServices.listMessages(
        this.getTenant(req),
        req.query,
      );
      return res.status(200).json(messages);
    } catch (err) {
      next(err);
    }
  };

  syncMessages = async (req: Request, res: Response, next: NextFunction) => {
    // console.log("Syncing messages...");
    try {
      const result = await gmailServices.syncAllMessages(
        this.getTenant(req),
        req.query,
      );
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getMessage = async (
    req: Request<{ messageId: string }, {}, {}, GetMessageQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const message = await gmailServices.getMessage(
        this.getTenant(req),
        req.params.messageId,
      );
      return res.status(200).json(message);
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (
    req: Request<{}, {}, SendMessageBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const sent = await gmailServices.sendMessage(
        this.getTenant(req),
        req.body,
      );
      return res.status(201).json(sent);
    } catch (err) {
      next(err);
    }
  };

  deleteMessage = async (
    req: Request<{ messageId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await gmailServices.deleteMessage(
        this.getTenant(req),
        req.params.messageId,
      );
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  trashMessage = async (
    req: Request<{ messageId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const message = await gmailServices.trashMessage(
        this.getTenant(req),
        req.params.messageId,
      );
      return res.status(200).json(message);
    } catch (err) {
      next(err);
    }
  };

  untrashMessage = async (
    req: Request<{ messageId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const message = await gmailServices.untrashMessage(
        this.getTenant(req),
        req.params.messageId,
      );
      return res.status(200).json(message);
    } catch (err) {
      next(err);
    }
  };

  modifyMessage = async (
    req: Request<{ messageId: string }, {}, ModifyMessageBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const message = await gmailServices.modifyMessage(
        this.getTenant(req),
        req.params.messageId,
        req.body,
      );
      return res.status(200).json(message);
    } catch (err) {
      next(err);
    }
  };

  batchModifyMessages = async (
    req: Request<{}, {}, BatchModifyMessagesBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await gmailServices.batchModifyMessages(this.getTenant(req), req.body);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  listThreads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threads = await gmailServices.listThreads(
        this.getTenant(req),
        req.query,
      );
      return res.status(200).json(threads);
    } catch (err) {
      next(err);
    }
  };

  getThread = async (
    req: Request<{ threadId: string }, {}, {}, GetThreadQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const thread = await gmailServices.getThread(
        this.getTenant(req),
        req.params.threadId,
      );
      return res.status(200).json(thread);
    } catch (err) {
      next(err);
    }
  };

  modifyThread = async (
    req: Request<{ threadId: string }, {}, ModifyThreadBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const thread = await gmailServices.modifyThread(
        this.getTenant(req),
        req.params.threadId,
        req.body,
      );
      return res.status(200).json(thread);
    } catch (err) {
      next(err);
    }
  };

  trashThread = async (
    req: Request<{ threadId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const thread = await gmailServices.trashThread(
        this.getTenant(req),
        req.params.threadId,
      );
      return res.status(200).json(thread);
    } catch (err) {
      next(err);
    }
  };

  untrashThread = async (
    req: Request<{ threadId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const thread = await gmailServices.untrashThread(
        this.getTenant(req),
        req.params.threadId,
      );
      return res.status(200).json(thread);
    } catch (err) {
      next(err);
    }
  };

  deleteThread = async (
    req: Request<{ threadId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await gmailServices.deleteThread(
        this.getTenant(req),
        req.params.threadId,
      );
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  listDrafts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const drafts = await gmailServices.listDrafts(
        this.getTenant(req),
        req.query,
      );
      return res.status(200).json(drafts);
    } catch (err) {
      next(err);
    }
  };

  getDraft = async (
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const draft = await gmailServices.getDraft(
        this.getTenant(req),
        req.params.draftId,
      );
      return res.status(200).json(draft);
    } catch (err) {
      next(err);
    }
  };

  createDraft = async (
    req: Request<{}, {}, CreateDraftBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const draft = await gmailServices.createDraft(
        this.getTenant(req),
        req.body,
      );
      return res.status(201).json(draft);
    } catch (err) {
      next(err);
    }
  };

  updateDraft = async (
    req: Request<{ draftId: string }, {}, UpdateDraftBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const draft = await gmailServices.updateDraft(
        this.getTenant(req),
        req.params.draftId,
        req.body,
      );
      return res.status(200).json(draft);
    } catch (err) {
      next(err);
    }
  };

  deleteDraft = async (
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await gmailServices.deleteDraft(this.getTenant(req), req.params.draftId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  sendDraft = async (
    req: Request<{ draftId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const sent = await gmailServices.sendDraft(
        this.getTenant(req),
        req.params.draftId,
      );
      return res.status(200).json(sent);
    } catch (err) {
      next(err);
    }
  };

  listLabels = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = await gmailServices.listLabels(this.getTenant(_req));
      const labelArray: GmailLabelData[] = Array.isArray(raw)
        ? (raw as GmailLabelData[])
        : ((raw as GmailLabelsListApiResponse).labels ?? []);

      const labels: NormalizedLabel[] = labelArray.map((label) => ({
        id: label.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        account_id: "",
        entity_id: label.id,
        entity_type: "labels" as const,
        version: "1",
        data: label,
      }));
      return res.status(200).json(labels);
    } catch (err) {
      next(err);
    }
  };

  getLabel = async (
    req: Request<{ labelId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const label = await gmailServices.getLabel(
        this.getTenant(req),
        req.params.labelId,
      );
      return res.status(200).json(label);
    } catch (err) {
      next(err);
    }
  };

  createLabel = async (
    req: Request<{}, {}, CreateLabelBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const label = await gmailServices.createLabel(
        this.getTenant(req),
        req.body,
      );
      return res.status(201).json(label);
    } catch (err) {
      next(err);
    }
  };

  deleteLabel = async (
    req: Request<{ labelId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      await gmailServices.deleteLabel(this.getTenant(req), req.params.labelId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  updateLabel = async (
    req: Request<{ labelId: string }, {}, UpdateLabelBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const label = await gmailServices.updateLabel(
        this.getTenant(req),
        req.params.labelId,
        req.body,
      );
      return res.status(200).json(label);
    } catch (err) {
      next(err);
    }
  };
}
