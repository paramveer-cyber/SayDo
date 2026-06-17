import type { Request, Response, NextFunction } from "express";
import type { GetMessageQuery, SendMessageBody, ModifyMessageBody, BatchModifyMessagesBody, GetThreadQuery, ModifyThreadBody, CreateDraftBody, UpdateDraftBody, CreateLabelBody, UpdateLabelBody } from "./gmail.modals.js";
export declare class GmailController {
    private getTenant;
    private static readonly WORKFLOW_EVENTS;
    runWorkflow: (req: Request<{
        workflowId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    listMessages: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    syncMessages: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getMessage: (req: Request<{
        messageId: string;
    }, {}, {}, GetMessageQuery>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    sendMessage: (req: Request<{}, {}, SendMessageBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteMessage: (req: Request<{
        messageId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    trashMessage: (req: Request<{
        messageId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    untrashMessage: (req: Request<{
        messageId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    modifyMessage: (req: Request<{
        messageId: string;
    }, {}, ModifyMessageBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    batchModifyMessages: (req: Request<{}, {}, BatchModifyMessagesBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    listThreads: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getThread: (req: Request<{
        threadId: string;
    }, {}, {}, GetThreadQuery>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    modifyThread: (req: Request<{
        threadId: string;
    }, {}, ModifyThreadBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    trashThread: (req: Request<{
        threadId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    untrashThread: (req: Request<{
        threadId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteThread: (req: Request<{
        threadId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    listDrafts: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getDraft: (req: Request<{
        draftId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createDraft: (req: Request<{}, {}, CreateDraftBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateDraft: (req: Request<{
        draftId: string;
    }, {}, UpdateDraftBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteDraft: (req: Request<{
        draftId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    sendDraft: (req: Request<{
        draftId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    listLabels: (_req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getLabel: (req: Request<{
        labelId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createLabel: (req: Request<{}, {}, CreateLabelBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteLabel: (req: Request<{
        labelId: string;
    }>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    updateLabel: (req: Request<{
        labelId: string;
    }, {}, UpdateLabelBody>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=gmail.controller.d.ts.map