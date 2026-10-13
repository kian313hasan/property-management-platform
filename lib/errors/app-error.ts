export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AppError";
  }
}

/** Anything that is not an AppError is an unexpected failure and is reduced to a generic error. */
export function toSafeError(error: unknown): AppError {
  return error instanceof AppError ? error : new AppError("INTERNAL_ERROR", "An unexpected error occurred.");
}
