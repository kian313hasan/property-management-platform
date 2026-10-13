import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPasswordResetUrl, deliverPasswordResetLink } from "@/lib/mail/local-mailer";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("local mailer", () => {
  it("builds an encoded reset URL without a double slash", () => {
    expect(buildPasswordResetUrl("a+b/c", "http://localhost:3000/")).toBe("http://localhost:3000/reset-password?token=a%2Bb%2Fc");
  });

  it("prints the link to the console outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    await deliverPasswordResetLink("user@example.test", "tok");
    expect(String(spy.mock.calls[0]?.[0])).toContain("/reset-password?token=tok");
  });

  it("never prints the token in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await deliverPasswordResetLink("user@example.test", "secret-token");
    expect(JSON.stringify([...info.mock.calls, ...warn.mock.calls])).not.toContain("secret-token");
    expect(warn).toHaveBeenCalled();
  });
});
