type LogLevel = "info" | "warn" | "error";
export type LogContext = Record<string, string | number | boolean | null | undefined>;

/** Keys whose values must never be written to logs, whatever the value looks like. */
const SENSITIVE_KEY = /(pass(word|wd)?|secret|token|api[-_]?key|authorization|cookie|session|credential|private[-_]?key)/i;

export function redactContext(context: LogContext): LogContext {
  return Object.fromEntries(Object.entries(context).filter(([key]) => !SENSITIVE_KEY.test(key)));
}

/**
 * Reduces an unknown thrown value to loggable fields. Error messages (which for database errors can
 * contain SQL fragments or values) are only included outside production.
 */
export function serializeError(error: unknown): LogContext {
  const base: LogContext = {
    errorName: error instanceof Error ? error.name : typeof error,
    errorCode:
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
        ? error.code
        : undefined,
  };
  if (process.env.NODE_ENV !== "production" && error instanceof Error) base.errorMessage = error.message;
  return base;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redactContext(context),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
