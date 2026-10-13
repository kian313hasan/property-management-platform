import { afterEach, describe, expect, it, vi } from "vitest";
import { logger, redactContext, serializeError } from "@/lib/logging/logger";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("structured logging", () => {
  it("drops sensitive keys regardless of casing or prefix", () => {
    const redacted = redactContext({
      password: "p",
      newPassword: "p",
      AUTH_SECRET: "s",
      resetToken: "t",
      apiKey: "k",
      Authorization: "Bearer x",
      cookie: "c",
      sessionToken: "st",
      requestId: "keep-me",
      action: "LOGIN",
    });
    expect(redacted).toEqual({ requestId: "keep-me", action: "LOGIN" });
  });

  it("writes one JSON line with timestamp, level and message and never the redacted values", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    logger.info("login_attempt", { requestId: "r1", password: "hunter2" });
    const line = String(spy.mock.calls[0]?.[0]);
    const parsed: Record<string, unknown> = JSON.parse(line);
    expect(parsed).toMatchObject({ level: "info", message: "login_attempt", requestId: "r1" });
    expect(typeof parsed.timestamp).toBe("string");
    expect(line).not.toContain("hunter2");
  });

  it("omits error messages in production because they may contain SQL or values", () => {
    const error = Object.assign(new Error('value "secret@example.com" violates constraint'), { code: "P2002" });
    vi.stubEnv("NODE_ENV", "production");
    expect(serializeError(error)).toEqual({ errorName: "Error", errorCode: "P2002", errorMessage: undefined });
    vi.stubEnv("NODE_ENV", "development");
    expect(serializeError(error).errorMessage).toContain("violates constraint");
  });
});
