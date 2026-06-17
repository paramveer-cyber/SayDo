import { sendAIPrompt } from "./corsair.services.js";
export const promptAI = async (req, res, next) => {
    try {
        const { prompt, useLocalModal, mcpServer } = req.body;
        const accessToken = req.headers.authorization?.split(" ")[1] ?? "";
        const response = await sendAIPrompt(prompt, useLocalModal, accessToken, mcpServer);
        return res.status(200).json({ success: true, message: response });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=corsair.controller.js.map