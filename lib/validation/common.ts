import { z } from "zod";

/** Opaque identifier (cuid/uuid). Existence and ownership are always checked server-side. */
export const idSchema = z.string().trim().min(1).max(64);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email();

/**
 * Shared password policy for credentials (NIST SP 800-63B minimum of 8 characters, bounded above so
 * oversized payloads are rejected before any hashing work). The first-admin bootstrap script enforces
 * a stricter 12-character minimum for the most privileged account.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH);

const MONEY_PATTERN = /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;

/**
 * Money is validated and kept as a decimal *string* (matches Decimal(18, 2)); it is never converted to a
 * JavaScript float. Prisma accepts the string for Decimal columns, so no rounding error can occur.
 * `message` is the error text (an i18n key in server actions). With `allowZero` the value may be 0.
 */
export function moneyField(message: string, options: { allowZero?: boolean } = {}) {
  return z
    .string()
    .trim()
    .regex(MONEY_PATTERN, message)
    .refine((value) => options.allowZero || Number(value) > 0, message);
}

/** Strictly positive money, e.g. a rent or payment amount. */
export const moneySchema = moneyField("Money values must be positive with at most two decimal places.");

/** ISO calendar date (YYYY-MM-DD) as produced by <input type="date">. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), { message: "Invalid calendar date." });

export const localeSchema = z.enum(["ar", "en", "fa"]);
