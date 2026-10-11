import Link from "next/link";
import { completePasswordResetAction } from "@/actions/password-reset";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export const metadata = {
  title: "تعيين كلمة مرور جديدة",
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token, error } = await searchParams;
  const hasToken = typeof token === "string" && token.length > 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
        <p className="mt-2 text-sm text-slate-500">
          أدخل كلمة مرور جديدة لا تقل عن 8 أحرف. صلاحية رابط الاستعادة محدودة.
        </p>
        {error === "validation" && (
          <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            تأكد من تطابق كلمتي المرور وأنهما تحتويان على 8 أحرف على الأقل.
          </p>
        )}
        {error === "invalid" && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            رابط الاستعادة غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً ثم حاول مرة أخرى.
          </p>
        )}
        {!hasToken ? (
          <div className="mt-6">
            <p className="text-sm text-slate-600">رابط الاستعادة غير مكتمل.</p>
            <Link href="/forgot-password" className="mt-4 inline-block font-semibold text-slate-900 hover:underline">
              طلب رابط استعادة جديد
            </Link>
          </div>
        ) : (
          <form action={async (formData: FormData) => { "use server"; await completePasswordResetAction(formData); }} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <label className="block text-sm font-semibold">
              كلمة المرور الجديدة
              <input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required className="mt-2 w-full rounded-xl border px-4 py-3" />
            </label>
            <label className="block text-sm font-semibold">
              تأكيد كلمة المرور
              <input name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required className="mt-2 w-full rounded-xl border px-4 py-3" />
            </label>
            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">
              حفظ كلمة المرور الجديدة
            </button>
          </form>
        )}
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-slate-600">
          العودة لتسجيل الدخول
        </Link>
      </section>
    </main>
  );
}
