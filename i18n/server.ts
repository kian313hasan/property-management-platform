import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, localeDirection, resolveLocale, type Locale } from "./config";
import { createTranslator } from "./index";

export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
}

/** Locale, text direction and translator for the current request (server components only). */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, dir: localeDirection[locale], t: createTranslator(locale) };
}
