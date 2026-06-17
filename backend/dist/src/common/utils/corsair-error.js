import { ApiError } from "./api-error.js";
const isAuthMissingError = (error) => error.name === "AuthMissingError" &&
    typeof error.pluginId === "string";
const isRateLimitedError = (error) => {
    const isRateLimitError = error
        .isRateLimitError;
    if (typeof isRateLimitError === "function") {
        return isRateLimitError.call(error) === true;
    }
    return error.status === 429;
};
export const isUnauthorizedFromUpstream = (error) => error.status === 401;
export const isTokenRefreshFailure = (error) => /failed to (obtain valid|refresh) access token/i.test(error.message);
const isDelegationDenied = (error) => /delegation denied/i.test(error.message);
export const isRecoverableAuthHiccup = (error) => error instanceof Error &&
    !isDelegationDenied(error) &&
    (isTokenRefreshFailure(error) || isUnauthorizedFromUpstream(error));
export const mapCorsairError = (error) => {
    if (!(error instanceof Error))
        return null;
    if (isAuthMissingError(error)) {
        const pluginName = error.pluginId;
        return ApiError.unAuthorized(`${pluginName} is not connected. Connect ${pluginName} and try again.`);
    }
    if (isRateLimitedError(error)) {
        return ApiError.tooManyRequests("Rate limited by the connected service. Please try again shortly.");
    }
    if (isTokenRefreshFailure(error)) {
        return ApiError.internal("Failed to refresh access token. Please try again.");
    }
    if (isUnauthorizedFromUpstream(error)) {
        return ApiError.unAuthorized("Connected account's access has expired. Please reconnect it.");
    }
    return null;
};
//# sourceMappingURL=corsair-error.js.map