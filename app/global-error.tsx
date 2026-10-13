"use client";

import { localeDirection, locales } from "@/i18n/config";
import { messages } from "@/i18n";

/**
 * Last-resort boundary: it replaces the root layout, so the locale provider is not available and the
 * user's language is unknown here. The message is shown in every supported language instead.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
          {locales.map((locale) => (
            <section key={locale} lang={locale} dir={localeDirection[locale]} className="space-y-2">
              <h1 className="text-xl font-bold">{messages[locale].states.errorTitle}</h1>
              <button type="button" onClick={() => reset()} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {messages[locale].common.retry}
              </button>
            </section>
          ))}
        </main>
      </body>
    </html>
  );
}
