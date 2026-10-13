import { logger } from "@/lib/logging/logger";

/**
 * Local-only mail delivery (ADR-012). No external email provider is configured, so in development
 * the password-reset link is printed to the server console. In production nothing is printed:
 * the link is a credential and must never reach logs; a warning records that delivery is missing.
 */
export function buildPasswordResetUrl(token: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function deliverPasswordResetLink(email: string, token: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    logger.warn("password_reset_email_not_configured");
    return;
  }
  const url = buildPasswordResetUrl(token, process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  // Deliberately console.info, not the structured logger, which would redact it as a token.
  console.info(`[local-mailer] Password reset for ${email}: ${url}`);
}
