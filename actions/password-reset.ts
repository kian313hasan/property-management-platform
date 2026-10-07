"use server";

import { z } from "zod";
import { requestPasswordReset } from "@/lib/security/password-reset";

const schema = z.object({ email: z.string().email() });

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (parsed.success) {
    await requestPasswordReset(parsed.data.email);
  }

  // Always return the same response to avoid account enumeration.
  return { success: true };
}
