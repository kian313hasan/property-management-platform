import { ar } from "./messages/ar"; import { en } from "./messages/en"; import { fa } from "./messages/fa"; import type { Locale } from "./config";
export const messages = { ar, en, fa } as const;
export function getMessages(locale: Locale) { return messages[locale] ?? messages.en; }
