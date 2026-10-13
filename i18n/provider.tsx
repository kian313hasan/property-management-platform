"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localeDirection, type Locale } from "./config";
import { createTranslator, type Translator } from "./index";

type I18nValue = { locale: Locale; dir: "rtl" | "ltr"; t: Translator };

const I18nContext = createContext<I18nValue | null>(null);

/** Makes `t()` available to client components. The locale is resolved on the server (see i18n/server.ts). */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nValue>(() => ({ locale, dir: localeDirection[locale], t: createTranslator(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>.");
  return value;
}
