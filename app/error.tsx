"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logging/logger";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { logger.error("render_error", { digest: error.digest }); }, [error.digest]);
  return <main dir="rtl" className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6"><h1 className="text-2xl font-bold">حدث خطأ غير متوقع</h1><p className="text-sm text-slate-600">يرجى المحاولة مرة أخرى.</p><button onClick={() => reset()} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">إعادة المحاولة</button></main>;
}
