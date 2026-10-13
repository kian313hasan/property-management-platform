"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { logger, serializeError } from "@/lib/logging/logger";
import { loginSchema } from "@/lib/validation/auth";

/** Machine-readable outcome; the UI maps it to a translated message (see i18n/messages). */
export type LoginError = "invalid_input" | "invalid_credentials" | "unexpected";
export type LoginState = { error?: LoginError };

/**
 * Credentials are verified in exactly one place: the Auth.js `authorize` callback, which applies the
 * persistent rate limit, records audit events and compares the password hash. This action must not
 * look users up or compare passwords itself, otherwise those checks could be bypassed.
 */
export async function login(formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalid_input" };

  try {
    const result: unknown = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    // Depending on the Auth.js version a failed sign-in either throws or resolves to an error URL.
    if (typeof result === "string" && /[?&]error=/.test(result)) return { error: "invalid_credentials" };
  } catch (error) {
    if (error instanceof AuthError) return { error: "invalid_credentials" };
    logger.error("login_failed_unexpectedly", serializeError(error));
    return { error: "unexpected" };
  }

  redirect("/dashboard");
}
