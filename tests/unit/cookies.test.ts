import { describe, expect, it } from "vitest";
import { shouldUseSecureCookies } from "@/lib/security/cookies";

describe("shouldUseSecureCookies", () => {
  it("is on only when the public URL is HTTPS", () => {
    expect(shouldUseSecureCookies("https://app.example.com")).toBe(true);
    expect(shouldUseSecureCookies("http://localhost:3000")).toBe(false);
    expect(shouldUseSecureCookies("http://127.0.0.1:3000")).toBe(false);
    expect(shouldUseSecureCookies(undefined)).toBe(false);
    expect(shouldUseSecureCookies("")).toBe(false);
  });
});
