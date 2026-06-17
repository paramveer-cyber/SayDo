import { sendAIPrompt } from "./corsair.services.js";
import { incrementPromptsAsked } from "../auth/auth.queries.js";
export const promptAI = async (req, res, next) => {
    try {
        const { prompt, useLocalModal, mcpServer } = req.body;
        const accessToken = req.headers.authorization?.split(" ")[1] ?? "";
        const userId = req.user;
        const response = await sendAIPrompt(prompt, useLocalModal, accessToken, mcpServer, req.userSettings);
        incrementPromptsAsked(userId).catch(() => { });
        return res.status(200).json({ success: true, message: response });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=corsair.controller.js.map