import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/password-reset";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
        <p className="mt-2 text-sm text-slate-500">
          أدخل بريدك الإلكتروني. إذا كان الحساب موجودًا، سيتم إرسال تعليمات الاستعادة.
        </p>
        <form action={requestPasswordResetAction} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            البريد الإلكتروني
            <input name="email" type="email" required className="mt-2 w-full rounded-xl border px-4 py-3" />
          </label>
          <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">
            إرسال تعليمات الاستعادة
          </button>
        </form>
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-slate-600">
          العودة لتسجيل الدخول
        </Link>
      </section>
    </main>
  );
}
