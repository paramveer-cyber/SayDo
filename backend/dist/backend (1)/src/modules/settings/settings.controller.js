import { ok } from "../../common/utils/response.js";
import { ApiError } from "../../common/utils/api-error.js";
import { findSettingsByUserId, createDefaultSettings, updateSettings, } from "../auth/auth.queries.js";
export const getSettings = async (req, res, next) => {
    try {
        const userId = req.user;
        let settings = await findSettingsByUserId(userId);
        if (!settings)
            settings = await createDefaultSettings(userId);
        return ok(res, "Settings fetched", { settings });
    }
    catch (err) {
        next(err);
    }
};
export const patchSettings = async (req, res, next) => {
    try {
        const userId = req.user;
        const existing = await findSettingsByUserId(userId);
        if (!existing)
            await createDefaultSettings(userId);
        const updated = await updateSettings(userId, req.body);
        if (!updated)
            throw ApiError.notFound("Settings not found");
        return ok(res, "Settings updated", { settings: updated });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=settings.controller.js.map