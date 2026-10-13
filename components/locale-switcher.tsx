import { setLocale } from "@/actions/locale";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Language picker. Posts to a server action that validates the value and stores it in a cookie. */
export function LocaleSwitcher({ locale, label, className }: { locale: Locale; label: string; className?: string }) {
  return (
    <form action={setLocale} aria-label={label} className={cn("inline-flex items-center gap-1", className)}>
      {locales.map((code) => (
        <button
          key={code}
          type="submit"
          name="locale"
          value={code}
          lang={code}
          aria-pressed={code === locale}
          className={cn(
            "h-8 rounded-control px-2.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            code === locale ? "bg-primary text-primary-fg" : "text-fg-muted hover:bg-surface-muted",
          )}
        >
          {localeNames[code]}
        </button>
      ))}
    </form>
  );
}
