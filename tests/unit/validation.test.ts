import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  emailSchema,
  idSchema,
  isoDateSchema,
  localeSchema,
  moneySchema,
  passwordSchema,
} from "@/lib/validation/common";
import { loginSchema, passwordResetCompletionSchema } from "@/lib/validation/auth";

describe("common validation", () => {
  it("normalizes email to trimmed lower case and rejects malformed values", () => {
    expect(emailSchema.parse("  User@Example.COM ")).toBe("user@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse(`${"a".repeat(250)}@x.io`).success).toBe(false);
  });

  it("bounds password length on both sides", () => {
    expect(passwordSchema.safeParse("x".repeat(PASSWORD_MIN_LENGTH - 1)).success).toBe(false);
    expect(passwordSchema.safeParse("x".repeat(PASSWORD_MIN_LENGTH)).success).toBe(true);
    expect(passwordSchema.safeParse("x".repeat(PASSWORD_MAX_LENGTH + 1)).success).toBe(false);
  });

  it("accepts money with at most two decimals and rejects the rest", () => {
    expect(moneySchema.parse("1200.50")).toBe(1200.5);
    for (const bad of ["0", "-5", "1.005", "abc", "Infinity", "1e15"]) {
      expect(moneySchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("accepts only real ISO calendar dates", () => {
    expect(isoDateSchema.safeParse("2026-02-28").success).toBe(true);
    expect(isoDateSchema.safeParse("2026-13-01").success).toBe(false);
    expect(isoDateSchema.safeParse("28/02/2026").success).toBe(false);
  });

  it("restricts locales to ar, en and fa", () => {
    expect(localeSchema.safeParse("fa").success).toBe(true);
    expect(localeSchema.safeParse("fr").success).toBe(false);
  });

  it("rejects empty and oversized identifiers", () => {
    expect(idSchema.safeParse("   ").success).toBe(false);
    expect(idSchema.safeParse("x".repeat(65)).success).toBe(false);
  });
});

describe("auth validation", () => {
  it("validates login input", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "12345678" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "short" }).success).toBe(false);
  });

  it("requires matching passwords for a reset", () => {
    const base = { token: "t", password: "12345678", confirmPassword: "12345678" };
    expect(passwordResetCompletionSchema.safeParse(base).success).toBe(true);
    expect(passwordResetCompletionSchema.safeParse({ ...base, confirmPassword: "87654321" }).success).toBe(false);
  });
});
