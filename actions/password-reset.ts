"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { consumePasswordReset } from "@/lib/security/password-reset";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
});

export async function completePasswordResetAction(formData: FormData) {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/reset-password?error=invalid");
  }

  const completed = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (!completed) {
    redirect("/reset-password?error=invalid");
  }

  redirect("/login?passwordReset=success");
}
