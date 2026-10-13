export const locales = ["ar", "en", "fa"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";

export const localeDirection: Record<Locale, "rtl" | "ltr"> = { ar: "rtl", en: "ltr", fa: "rtl" };
/** Each language is shown in its own script so a user can always find it. */
export const localeNames: Record<Locale, string> = { ar: "العربية", en: "English", fa: "فارسی" };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** "ar-SA" / "fa_IR" / "EN" -> the supported base locale, if any. */
export function matchLocale(tag: string | null | undefined): Locale | undefined {
  const base = tag?.trim().toLowerCase().split(/[-_]/)[0];
  return base && isLocale(base) ? base : undefined;
}

/** First supported language in an Accept-Language header, honouring q-values. */
export function pickFromAcceptLanguage(header: string | null | undefined): Locale | undefined {
  if (!header) return undefined;
  const candidates = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter((candidate) => candidate.tag && candidate.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const candidate of candidates) {
    const locale = matchLocale(candidate.tag);
    if (locale) return locale;
  }
  return undefined;
}

/** Cookie (explicit user choice) wins over the browser preference, which wins over the default. */
export function resolveLocale(input: { cookie?: string | null; acceptLanguage?: string | null }): Locale {
  const fromCookie = input.cookie && isLocale(input.cookie) ? input.cookie : undefined;
  return fromCookie ?? pickFromAcceptLanguage(input.acceptLanguage) ?? defaultLocale;
}
