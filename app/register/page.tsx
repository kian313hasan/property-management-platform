import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">PM</div>
          <h1 className="text-2xl font-bold">التسجيل العام غير متاح</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            يتم إنشاء الحسابات من قبل مسؤول المؤسسة لضمان ربط كل مستخدم بالمؤسسة والدور الصحيح.
          </p>
          <Link href="/login" className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            العودة إلى تسجيل الدخول
          </Link>
        </div>
      </div>
    </main>
  );
}
