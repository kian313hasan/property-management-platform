import type { MessageKey } from "@/i18n";
import { isMessageKey } from "@/i18n";

/**
 * Result of a server action that can fail. `error` is a translation key (never display text), so the
 * UI renders it in the user's language with `t(state.error)`.
 */
export type ActionState = { error?: MessageKey; success?: boolean };

/** Fallback for validation failures whose message is not one of our keys (e.g. a zod default message). */
export function validationErrorKey(message: string | undefined): MessageKey {
  return isMessageKey(message) ? message : "actionErrors.invalidData";
}
