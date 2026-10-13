import { z } from "zod";

const optionalString = z.string().optional();
const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalEmail = z.string().email().optional().or(z.literal(""));

export const envSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  AUTH_SECRET: z.string().min(32),
  STORAGE_ENDPOINT: optionalUrl,
  STORAGE_BUCKET: optionalString,
  STORAGE_ACCESS_KEY_ID: optionalString,
  STORAGE_SECRET_ACCESS_KEY: optionalString,
  EMAIL_FROM: optionalEmail,
  EMAIL_API_KEY: optionalString,
  SENTRY_DSN: optionalUrl,
});

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly variables: readonly string[]) {
    super(
      `Invalid or missing environment variables: ${variables.join(", ")}. ` +
        "Copy .env.example to .env and fill in the values (see docs/DEVELOPMENT.md).",
    );
    this.name = "EnvValidationError";
  }
}

/**
 * Validates the raw environment. On failure only the *names* of the offending variables are
 * reported — never their values — so a misconfiguration cannot leak a secret into logs.
 */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  const result = envSchema.safeParse({
    DATABASE_URL: source.DATABASE_URL,
    AUTH_SECRET: source.AUTH_SECRET ?? source.NEXTAUTH_SECRET,
    STORAGE_ENDPOINT: source.STORAGE_ENDPOINT,
    STORAGE_BUCKET: source.STORAGE_BUCKET,
    STORAGE_ACCESS_KEY_ID: source.STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY: source.STORAGE_SECRET_ACCESS_KEY,
    EMAIL_FROM: source.EMAIL_FROM,
    EMAIL_API_KEY: source.EMAIL_API_KEY,
    SENTRY_DSN: source.SENTRY_DSN,
  });
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "environment")))];
    throw new EnvValidationError(names);
  }
  return result.data;
}
