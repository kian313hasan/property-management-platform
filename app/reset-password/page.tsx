import Link from "next/link";
import { completePasswordResetAction } from "@/actions/password-reset";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getI18n } from "@/i18n/server";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("auth.resetTitle"), referrer: "no-referrer" as const };
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token, error } = await searchParams;
  const { locale, t } = await getI18n();
  const hasToken = typeof token === "string" && token.length > 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-6 py-10 text-fg">
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-card">
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher locale={locale} label={t("common.language")} />
        </div>
        <h1 className="text-2xl font-bold">{t("auth.resetTitle")}</h1>
        <p className="mt-2 text-sm text-fg-muted">{t("auth.resetHint")}</p>
        {error === "validation" && (
          <Alert tone="warning" className="mt-4">
            {t("auth.resetValidation")}
          </Alert>
        )}
        {error === "invalid" && (
          <Alert tone="danger" className="mt-4">
            {t("auth.resetInvalid")}
          </Alert>
        )}
        {!hasToken ? (
          <div className="mt-6">
            <p className="text-sm text-fg-muted">{t("auth.resetMissingToken")}</p>
            <Link href="/forgot-password" className="mt-4 inline-block font-semibold hover:underline">
              {t("auth.resetRequestNew")}
            </Link>
          </div>
        ) : (
          <form
            action={async (formData: FormData) => {
              "use server";
              await completePasswordResetAction(formData);
            }}
            className="mt-6 space-y-4"
          >
            <input type="hidden" name="token" value={token} />
            <Field htmlFor="password" label={t("auth.resetNewPassword")}>
              <Input id="password" name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required dir="ltr" />
            </Field>
            <Field htmlFor="confirmPassword" label={t("auth.resetConfirmPassword")}>
              <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required dir="ltr" />
            </Field>
            <Button type="submit" className="w-full">
              {t("auth.resetSubmit")}
            </Button>
          </form>
        )}
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-fg-muted hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </section>
    </main>
  );
}
