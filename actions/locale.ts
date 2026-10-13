"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from "@/i18n/config";
import { localeSchema } from "@/lib/validation/common";

export async function setLocale(formData: FormData): Promise<void> {
  const parsed = localeSchema.safeParse(formData.get("locale"));
  if (!parsed.success) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, parsed.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
