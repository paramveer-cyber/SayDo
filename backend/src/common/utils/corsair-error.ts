import { ApiError } from "./api-error.js";

const isAuthMissingError = (
  error: Error,
): error is Error & { pluginId: string; authType: string } =>
  error.name === "AuthMissingError" &&
  typeof (error as { pluginId?: unknown }).pluginId === "string";

const isRateLimitedError = (error: Error): boolean => {
  const isRateLimitError = (error as { isRateLimitError?: unknown })
    .isRateLimitError;
  if (typeof isRateLimitError === "function") {
    return isRateLimitError.call(error) === true;
  }
  return (error as { status?: unknown }).status === 429;
};

export const isUnauthorizedFromUpstream = (error: Error): boolean =>
  (error as { status?: unknown }).status === 401;

export const isTokenRefreshFailure = (error: Error): boolean =>
  /failed to (obtain valid|refresh) access token/i.test(error.message);

export const isRecoverableAuthHiccup = (error: unknown): boolean =>
  error instanceof Error &&
  (isTokenRefreshFailure(error) || isUnauthorizedFromUpstream(error));

export const mapCorsairError = (error: unknown): ApiError | null => {
  if (!(error instanceof Error)) return null;

  if (isAuthMissingError(error)) {
    const pluginName = error.pluginId;
    return ApiError.unAuthorized(
      `${pluginName} is not connected. Connect ${pluginName} and try again.`,
    );
  }

  if (isRateLimitedError(error)) {
    return ApiError.tooManyRequests(
      "Rate limited by the connected service. Please try again shortly.",
    );
  }

  if (isTokenRefreshFailure(error) || isUnauthorizedFromUpstream(error)) {
    return ApiError.unAuthorized(
      "Connected account's access has expired. Please reconnect it.",
    );
  }

  return null;
};
