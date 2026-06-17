import { findSettingsByUserId, createDefaultSettings, } from "../auth/auth.queries.js";
export const injectUserSettings = async (req, res, next) => {
    try {
        const userId = req.user;
        let settings = await findSettingsByUserId(userId);
        if (!settings)
            settings = await createDefaultSettings(userId);
        if (settings)
            req.userSettings = settings;
        return next();
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=settings.middleware.js.map