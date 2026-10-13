import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/password-reset";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getI18n } from "@/i18n/server";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ requested?: string }> }) {
  const { requested } = await searchParams;
  const { locale, t } = await getI18n();

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-6 py-10 text-fg">
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-card">
        <div className="mb-4 flex justify-end">
          <LocaleSwitcher locale={locale} label={t("common.language")} />
        </div>
        <h1 className="text-2xl font-bold">{t("auth.forgotTitle")}</h1>
        <p className="mt-2 text-sm text-fg-muted">{t("auth.forgotHint")}</p>
        {requested === "1" && (
          <Alert tone="info" className="mt-4">
            {t("auth.forgotRequested")}
          </Alert>
        )}
        <form
          action={async (formData: FormData) => {
            "use server";
            await requestPasswordResetAction(formData);
          }}
          className="mt-6 space-y-4"
        >
          <Field htmlFor="email" label={t("auth.email")}>
            <Input id="email" name="email" type="email" required autoComplete="email" dir="ltr" />
          </Field>
          <Button type="submit" className="w-full">
            {t("auth.forgotSubmit")}
          </Button>
        </form>
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-fg-muted hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </section>
    </main>
  );
}
