import { toSafeError, type AppErrorCode } from "./app-error";

export const ERROR_STATUS: Readonly<Record<AppErrorCode, number>> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export type ErrorEnvelope = {
  error: { code: AppErrorCode; message: string; requestId: string };
};

/**
 * Builds the public error response described in docs/API-CONTRACT.md.
 *
 * Only AppError messages are exposed (they are written to be user-safe). Any other error — Prisma,
 * network, programming errors — is replaced by a generic message, so stack traces, SQL, internal
 * paths and secrets never reach the client. Callers log the original error server-side.
 */
export function toErrorResponse(error: unknown, requestId: string): { status: number; body: ErrorEnvelope } {
  const safe = toSafeError(error);
  return {
    status: ERROR_STATUS[safe.code],
    body: { error: { code: safe.code, message: safe.message, requestId } },
  };
}
