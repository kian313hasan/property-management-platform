import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  isLocale,
  localeDirection,
  locales,
  matchLocale,
  pickFromAcceptLanguage,
  resolveLocale,
} from "@/i18n/config";
import { formatCurrency, formatDate, formatNumber } from "@/i18n/format";
import { createTranslator, messages } from "@/i18n";

function leafPaths(tree: unknown, prefix = ""): string[] {
  if (typeof tree !== "object" || tree === null) return [prefix];
  return Object.entries(tree).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key));
}

describe("locale configuration", () => {
  it("supports exactly ar, en and fa with the right direction", () => {
    expect([...locales]).toEqual(["ar", "en", "fa"]);
    expect(localeDirection).toEqual({ ar: "rtl", en: "ltr", fa: "rtl" });
    expect(isLocale("fr")).toBe(false);
  });

  it("matches regional tags to a supported base locale", () => {
    expect(matchLocale("ar-SA")).toBe("ar");
    expect(matchLocale("fa_IR")).toBe("fa");
    expect(matchLocale("de-DE")).toBeUndefined();
  });

  it("honours q-values in Accept-Language", () => {
    expect(pickFromAcceptLanguage("fr;q=0.9, fa;q=0.8, en;q=0.4")).toBe("fa");
    expect(pickFromAcceptLanguage("en;q=0, ar;q=0.1")).toBe("ar");
    expect(pickFromAcceptLanguage(null)).toBeUndefined();
  });

  it("prefers the cookie, then the browser, then the default", () => {
    expect(resolveLocale({ cookie: "ar", acceptLanguage: "fa" })).toBe("ar");
    expect(resolveLocale({ cookie: "xx", acceptLanguage: "fa" })).toBe("fa");
    expect(resolveLocale({})).toBe(defaultLocale);
  });
});

describe("translations", () => {
  it("provides the same keys in every locale", () => {
    const reference = leafPaths(messages.en).sort();
    for (const locale of locales) expect(leafPaths(messages[locale]).sort(), locale).toEqual(reference);
  });

  it("has no empty translation", () => {
    for (const locale of locales) {
      for (const path of leafPaths(messages[locale])) {
        const value = path.split(".").reduce<unknown>((node, part) => Reflect.get(Object(node), part), messages[locale]);
        expect(typeof value === "string" && value.trim().length > 0, `${locale}:${path}`).toBe(true);
      }
    }
  });

  it("falls back to the key when a translation does not exist", () => {
    const t = createTranslator("ar");
    // @ts-expect-error deliberately an unknown key to exercise the last-resort fallback
    expect(t("does.not.exist")).toBe("does.not.exist");
  });
});

describe("locale-aware formatting", () => {
  const sample = new Date(Date.UTC(2026, 2, 21, 12));

  it("formats numbers and currency per locale", () => {
    expect(formatNumber("en", 1234567.5)).toBe("1,234,567.5");
    expect(formatCurrency("en", 10, "USD")).toBe("$10.00");
    for (const locale of locales) expect(formatNumber(locale, 1234)).toMatch(/^[0-9]/);
    expect(formatNumber("fa", 123)).toBe("123");
    expect(formatNumber("ar", 123)).toBe("123");
  });

  it("formats dates with Western digits and the Gregorian year for every locale", () => {
    for (const locale of locales) {
      const text = formatDate(locale, sample, { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" });
      expect(text, locale).toContain("2026");
      expect(text, locale).not.toMatch(/[٠-٩۰-۹]/);
    }
  });
});
