import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Alert } from "@/components/ui/alert";
import { getI18n } from "@/i18n/server";
import LoginForm from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ passwordReset?: string }> }) {
  const { passwordReset } = await searchParams;
  const { locale, t } = await getI18n();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-fg">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center gap-4">
        <div className="flex justify-end rounded-card bg-surface p-1 shadow-card">
          <LocaleSwitcher locale={locale} label={t("common.language")} />
        </div>
        <div className="w-full rounded-3xl bg-surface p-8 shadow-overlay">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-fg">PM</div>
            <h1 className="text-2xl font-bold">{t("auth.loginTitle")}</h1>
            <p className="mt-2 text-sm text-fg-muted">{t("auth.loginSubtitle")}</p>
          </div>
          {passwordReset === "success" && (
            <Alert tone="success" className="mb-5">
              {t("auth.passwordResetSuccess")}
            </Alert>
          )}
          <LoginForm
            labels={{
              email: t("auth.email"),
              emailPlaceholder: t("auth.emailPlaceholder"),
              password: t("auth.password"),
              signIn: t("auth.signIn"),
              signingIn: t("auth.signingIn"),
              errors: {
                invalid_input: t("auth.errors.invalid_input"),
                invalid_credentials: t("auth.errors.invalid_credentials"),
                unexpected: t("auth.errors.unexpected"),
              },
            }}
          />
          <Link href="/forgot-password" className="mt-4 block text-center text-sm font-semibold text-fg-muted hover:underline">
            {t("auth.forgotPassword")}
          </Link>
          <p className="mt-6 text-center text-sm leading-6 text-fg-muted">{t("auth.registrationClosed")}</p>
        </div>
      </div>
    </main>
  );
}
