import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewPropertyForm from "./new-property-form";

export default async function NewPropertyPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PROPERTY_MANAGER") redirect("/properties");

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/properties" className="text-sm font-semibold text-slate-500">← العودة للعقارات</Link>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-bold">إضافة عقار جديد</h1>
          <p className="mt-2 text-sm text-slate-500">أدخل البيانات الأساسية للعقار، ويمكن إضافة الوحدات لاحقاً.</p>
          <NewPropertyForm />
        </div>
      </div>
    </main>
  );
}
