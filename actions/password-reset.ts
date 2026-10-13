"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { consumePasswordReset, requestPasswordReset } from "@/lib/security/password-reset";
import { checkPasswordResetRateLimit } from "@/lib/security/login-rate-limit";
import { deliverPasswordResetLink } from "@/lib/mail/local-mailer";
import { getClientIp } from "@/lib/security/client-ip";
import { passwordResetCompletionSchema, passwordResetRequestSchema } from "@/lib/validation/auth";

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = passwordResetRequestSchema.safeParse({ email: formData.get("email") });
  if (parsed.success) {
    const ip = getClientIp(await headers());
    // When rate limited the request is silently dropped: the response below is identical in every
    // case, so neither account existence nor the limiter state can be probed.
    const limited = await checkPasswordResetRateLimit(parsed.data.email, ip);
    if (!limited) {
      const token = await requestPasswordReset(parsed.data.email);
      if (token) await deliverPasswordResetLink(parsed.data.email, token);
    }
  }

  redirect("/forgot-password?requested=1");
}

export async function completePasswordResetAction(formData: FormData) {
  const token = formData.get("token");
  const parsed = passwordResetCompletionSchema.safeParse({
    token,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    if (typeof token === "string" && token.length > 0) {
      redirect(`/reset-password?error=validation&token=${encodeURIComponent(token)}`);
    }
    redirect("/reset-password?error=invalid");
  }

  const completed = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (!completed) {
    redirect("/reset-password?error=invalid");
  }

  redirect("/login?passwordReset=success");
}
