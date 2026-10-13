import { describe, expect, it } from "vitest";
import { EnvValidationError, envSchema, parseEnv } from "@/lib/config/env.schema";

const valid = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/property_management",
  AUTH_SECRET: "a".repeat(32),
};

describe("environment validation", () => {
  it("rejects missing required secrets", () => {
    expect(envSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a valid foundation environment", () => {
    expect(parseEnv(valid).DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it("accepts NEXTAUTH_SECRET as a legacy fallback for AUTH_SECRET", () => {
    expect(parseEnv({ DATABASE_URL: valid.DATABASE_URL, NEXTAUTH_SECRET: "b".repeat(32) }).AUTH_SECRET).toBe("b".repeat(32));
  });

  it("rejects a short AUTH_SECRET and names the variable", () => {
    expect(() => parseEnv({ ...valid, AUTH_SECRET: "too-short" })).toThrow(EnvValidationError);
    expect(() => parseEnv({ ...valid, AUTH_SECRET: "too-short" })).toThrow(/AUTH_SECRET/);
  });

  it("never echoes variable values in the failure message", () => {
    const secret = "super-secret-but-short";
    try {
      parseEnv({ ...valid, AUTH_SECRET: secret });
      throw new Error("expected parseEnv to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      expect(error instanceof Error ? error.message : "").not.toContain(secret);
    }
  });

  it("rejects a malformed DATABASE_URL", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "not-a-url" })).toThrow(/DATABASE_URL/);
  });
});
