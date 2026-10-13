import type { Locale } from "./config";

/**
 * BCP 47 tags handed to Intl. Arabic keeps Western digits (`-u-nu-latn`) because that is the common
 * convention in business software; Persian uses Persian digits and the Jalali calendar that `fa-IR`
 * defaults to. These two choices need product confirmation (docs/DECISIONS.md, ADR-010).
 */
const INTL_LOCALE: Record<Locale, string> = { ar: "ar-u-nu-latn", en: "en-US", fa: "fa-IR" };

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], options).format(value);
}

/** `currency` is an ISO 4217 code. Amounts are display-only; money arithmetic stays in Decimal. */
export function formatCurrency(
  locale: Locale,
  amount: number,
  currency: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency, ...options }).format(amount);
}

export function formatDate(
  locale: Locale,
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(new Date(value));
}
