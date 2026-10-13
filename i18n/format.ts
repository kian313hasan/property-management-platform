import type { Locale } from "./config";

/**
 * BCP 47 tags handed to Intl. Product decision (ADR-010): every locale uses Western digits (0-9)
 * and the Gregorian calendar, set explicitly so a browser or Node default (e.g. Jalali for fa-IR)
 * cannot change the output.
 */
const UNICODE_EXT = "-u-ca-gregory-nu-latn";
const INTL_LOCALE: Record<Locale, string> = { ar: `ar${UNICODE_EXT}`, en: `en-US${UNICODE_EXT}`, fa: `fa-IR${UNICODE_EXT}` };

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
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeZone: "UTC" },
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(new Date(value));
}

/**
 * Display-only amount (no currency is modelled yet): at most two decimals, Western digits. Money
 * arithmetic stays in Prisma Decimal / decimal strings; this is the last step before rendering.
 */
export function formatAmount(locale: Locale, amount: number | { toNumber(): number }): string {
  const value = typeof amount === "number" ? amount : amount.toNumber();
  return formatNumber(locale, value, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
