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

/** Positive decimal money value with at most two fraction digits (matches Decimal(18, 2)). */
export const moneySchema = z.coerce
  .number()
  .positive()
  .max(1_000_000_000_000)
  .refine((value) => Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
    message: "Money values allow at most two decimal places.",
  });

/** ISO calendar date (YYYY-MM-DD) as produced by <input type="date">. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), { message: "Invalid calendar date." });

export const localeSchema = z.enum(["ar", "en", "fa"]);
