import { defaultLocale, type Locale } from "./config";
import { ar } from "./messages/ar";
import { en, type Messages } from "./messages/en";
import { fa } from "./messages/fa";

export const messages: Record<Locale, Messages> = { ar, en, fa };
export type { Messages };

export function getMessages(locale: Locale): Messages {
  return messages[locale] ?? messages[defaultLocale];
}

/** Dot-separated path to every translated string, e.g. "auth.errors.invalid_credentials". */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
export type MessageKey = Paths<Messages>;

function lookup(tree: unknown, key: string): string | undefined {
  let node: unknown = tree;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null || !(part in node)) return undefined;
    node = Reflect.get(node, part);
  }
  return typeof node === "string" ? node : undefined;
}

export type TranslateParams = Readonly<Record<string, string | number>>;
export type Translator = (key: MessageKey, params?: TranslateParams) => string;

/** Replaces `{name}` placeholders. Unknown placeholders are left untouched so gaps stay visible. */
function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Runtime guard for values that must be a translation key (e.g. an error code returned by an action). */
export function isMessageKey(value: unknown): value is MessageKey {
  return typeof value === "string" && lookup(en, value) !== undefined;
}

/**
 * Returns `t(key, params?)` for a locale. A missing translation falls back to the default locale and,
 * as a last resort, to the key itself, so the UI never renders `undefined`.
 */
export function createTranslator(locale: Locale): Translator {
  const primary = getMessages(locale);
  const fallback = getMessages(defaultLocale);
  return (key, params) => interpolate(lookup(primary, key) ?? lookup(fallback, key) ?? key, params);
}
