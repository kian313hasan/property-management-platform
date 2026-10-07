"use client";
import { useActionState } from "react";
import { login } from "@/actions/auth";
type State = { error?: string; success?: string };
export default function LoginForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_previous, formData) => login(formData), {});
  return (
    <form action={formAction} className="space-y-5" dir="rtl">
      <div><label htmlFor="email" className="mb-2 block text-sm font-medium">البريد الإلكتروني</label><input id="email" name="email" type="email" required autoComplete="email" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="name@example.com" /></div>
      <div><label htmlFor="password" className="mb-2 block text-sm font-medium">كلمة المرور</label><input id="password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" placeholder="••••••••" /></div>
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">{pending ? "جارٍ الدخول..." : "دخول"}</button>
    </form>
  );
}
