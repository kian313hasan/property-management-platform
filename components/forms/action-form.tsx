"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/actions/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

type ActionFormProps = {
  /** A server action. It may redirect (success) or return an `ActionState` (failure / inline success). */
  action: (formData: FormData) => Promise<ActionState | void>;
  /** Already-translated submit label. */
  submitLabel: string;
  /** Disables the submit button, e.g. when a required list is empty. */
  disabled?: boolean;
  /** When the action reports `success`, navigate here and refresh server data. */
  successHref?: string;
  children: ReactNode;
};

/**
 * Shared client wrapper for create forms. Fields are plain (server-rendered) children; this component
 * owns the pending state and renders the translated error returned by the action.
 */
export function ActionForm({ action, submitLabel, disabled, successHref, children }: ActionFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (_previous, formData) => (await action(formData)) ?? {}, {});

  useEffect(() => {
    if (state.success && successHref) {
      router.push(successHref);
      router.refresh();
    }
  }, [state.success, successHref, router]);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      {children}
      {state.error && <Alert tone="danger">{t(state.error)}</Alert>}
      <Button type="submit" disabled={pending || disabled} className="w-full">
        {pending ? t("common.saving") : submitLabel}
      </Button>
    </form>
  );
}
