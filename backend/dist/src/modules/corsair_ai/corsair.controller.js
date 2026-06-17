import { sendAIPrompt } from "./corsair.services.js";
import { incrementPromptsAsked } from "../auth/auth.queries.js";
import { isPromptLimitExceeded, PROMPT_LIMITS, } from "../../common/utils/rbac.js";
import { ApiError } from "../../common/utils/api-error.js";
export const promptAI = async (req, res, next) => {
    try {
        const { prompt, useLocalModal, mcpServer, options } = req.body;
        const accessToken = req.headers.authorization?.split(" ")[1] ?? "";
        const userId = req.user;
        const userRole = req.userRole ?? "user";
        const settings = req.userSettings;
        const hasOwnApiKey = Boolean(settings?.geminiApiKey);
        const promptsAsked = settings?.promptsAsked ?? 0;
        if (isPromptLimitExceeded(userRole, promptsAsked, hasOwnApiKey)) {
            return next(ApiError.forbidden(`Prompt limit reached. Your plan allows ${PROMPT_LIMITS[userRole]} prompts total. Add your own Gemini API key in settings for unlimited usage, or upgrade your plan.`));
        }
        const response = await sendAIPrompt(prompt, useLocalModal, accessToken, mcpServer, settings, options?.history, userRole);
        incrementPromptsAsked(userId).catch(() => { });
        return res.status(200).json({ success: true, message: response });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=corsair.controller.js.map