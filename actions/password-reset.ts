"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { consumePasswordReset, requestPasswordReset } from "@/lib/security/password-reset";

const requestSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
});

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  if (parsed.success) {
    await requestPasswordReset(parsed.data.email);
  }

  // Keep the response generic to avoid account enumeration.
  redirect("/forgot-password?requested=1");
}

export async function completePasswordResetAction(formData: FormData) {
  const token = formData.get("token");
  const parsed = resetSchema.safeParse({
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
