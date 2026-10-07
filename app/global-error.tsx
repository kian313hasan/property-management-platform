"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="ar" dir="rtl"><body><main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6"><h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1><button onClick={() => reset()} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">إعادة المحاولة</button></main></body></html>;
}
