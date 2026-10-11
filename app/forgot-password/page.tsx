import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/password-reset";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ requested?: string }> }) {
  const { requested } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
        <p className="mt-2 text-sm text-slate-500">
          أدخل بريدك الإلكتروني لتسجيل طلب الاستعادة. لن يكشف النظام ما إذا كان الحساب موجودًا.
        </p>
        {requested === "1" && (
          <p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
            تم استلام الطلب. إرسال رسائل البريد الإلكتروني غير مفعّل في النسخة الجامعية الحالية، لذلك لن يصلك رابط تلقائياً.
          </p>
        )}
        <form action={async (formData: FormData) => { "use server"; await requestPasswordResetAction(formData); }} className="mt-6 space-y-4">
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
