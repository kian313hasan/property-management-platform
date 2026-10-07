"use client";

import { useActionState } from "react";
import { createProperty } from "@/actions/properties";

const initialState = { error: "" };

export default function NewPropertyForm() {
  const [state, formAction, pending] = useActionState(async (_prev, formData) => createProperty(formData), initialState);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <Field name="name" label="اسم العقار" placeholder="مثال: برج الياسمين" />
      <Field name="address" label="العنوان" placeholder="الشارع والمنطقة" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="city" label="المدينة" placeholder="دمشق" />
        <Field name="country" label="الدولة" placeholder="سوريا" />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold">نوع العقار</label>
        <select name="type" defaultValue="RESIDENTIAL" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400">
          <option value="RESIDENTIAL">سكني</option><option value="COMMERCIAL">تجاري</option><option value="MIXED">مختلط</option><option value="OTHER">أخرى</option>
        </select>
      </div>
      {state.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? "جاري الحفظ..." : "حفظ العقار"}</button>
    </form>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return <div><label htmlFor={name} className="mb-2 block text-sm font-semibold">{label}</label><input id={name} name={name} placeholder={placeholder} required className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400" /></div>;
}
