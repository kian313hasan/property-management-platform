import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export default async function RegisterPage() {
  const { locale, t } = await getI18n();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-fg">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center gap-4">
        <div className="flex justify-end rounded-card bg-surface p-1 shadow-card">
          <LocaleSwitcher locale={locale} label={t("common.language")} />
        </div>
        <div className="w-full rounded-3xl bg-surface p-8 text-center shadow-overlay">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-fg">PM</div>
          <h1 className="text-2xl font-bold">{t("auth.registrationClosed")}</h1>
          <Link href="/login" className={`${buttonVariants()} mt-6`}>
            {t("auth.backToLogin")}
          </Link>
        </div>
      </div>
    </main>
  );
}
