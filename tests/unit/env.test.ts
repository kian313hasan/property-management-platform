import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/config/env";

describe("environment validation", () => {
  it("rejects missing required secrets", () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts a valid foundation environment", () => {
    const result = envSchema.safeParse({
      DATABASE_URL: "postgresql://user:password@localhost:5432/property_management",
      AUTH_SECRET: "a".repeat(32),
    });
    expect(result.success).toBe(true);
  });
});
