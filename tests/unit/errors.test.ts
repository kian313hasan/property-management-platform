import { describe, expect, it } from "vitest";
import { AppError, toSafeError } from "@/lib/errors/app-error";
import { ERROR_STATUS, toErrorResponse } from "@/lib/errors/http";

describe("safe error handling", () => {
  it("exposes the code, safe message and request id of an AppError", () => {
    const { status, body } = toErrorResponse(new AppError("FORBIDDEN", "Nope."), "req-1");
    expect(status).toBe(403);
    expect(body).toEqual({ error: { code: "FORBIDDEN", message: "Nope.", requestId: "req-1" } });
  });

  it("replaces unexpected errors with a generic message (no SQL, paths or stack)", () => {
    const leaky = new Error('duplicate key value violates unique constraint "User_email_key" at /srv/app/lib/db.ts:42');
    const { status, body } = toErrorResponse(leaky, "req-2");
    const serialized = JSON.stringify(body);
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(serialized).not.toMatch(/duplicate key|User_email_key|\/srv\/app|\.ts:|stack/i);
  });

  it("treats non-Error throwables as internal errors", () => {
    expect(toSafeError("boom").code).toBe("INTERNAL_ERROR");
    expect(toSafeError(undefined).code).toBe("INTERNAL_ERROR");
  });

  it("maps every error code to an HTTP status", () => {
    expect(Object.values(ERROR_STATUS).every((status) => status >= 400 && status < 600)).toBe(true);
  });
});
