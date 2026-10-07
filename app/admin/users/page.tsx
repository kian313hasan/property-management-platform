import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserRole } from "@/actions/users";

const labels: Record<string,string> = { SUPER_ADMIN: "مدير النظام", PROPERTY_MANAGER: "مدير عقار", ACCOUNTANT: "محاسب", MAINTENANCE_MANAGER: "مدير صيانة", STAFF: "موظف", TENANT: "مستأجر" };

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  return <main className="min-h-screen bg-slate-50" dir="rtl">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><p className="text-xs font-semibold text-slate-400">PROPERTY MANAGEMENT PLATFORM</p><h1 className="text-xl font-bold">إدارة المستخدمين والصلاحيات</h1></div><div className="flex gap-3"><Link href="/dashboard" className="rounded-xl border px-4 py-2 text-sm font-semibold">لوحة التحكم</Link><Link href="/admin/users/new" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">+ مستخدم جديد</Link></div></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8"><div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="grid grid-cols-12 gap-4 border-b bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600"><span className="col-span-3">المستخدم</span><span className="col-span-3">البريد</span><span className="col-span-3">الدور</span><span className="col-span-3">تاريخ الإنشاء</span></div>{users.map(user=><div key={user.id} className="grid grid-cols-12 items-center gap-4 border-b px-5 py-4 last:border-0"><div className="col-span-3"><p className="font-semibold">{user.name||"بدون اسم"}</p></div><p className="col-span-3 text-sm text-slate-600">{user.email||"—"}</p><form action={updateUserRole} className="col-span-3 flex gap-2"><input type="hidden" name="userId" value={user.id}/><select name="role" defaultValue={user.role} className="w-full rounded-xl border px-3 py-2 text-sm">{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><button className="rounded-xl border px-3 py-2 text-xs font-semibold">حفظ</button></form><p className="col-span-3 text-sm text-slate-500">{user.createdAt.toLocaleDateString("ar")}</p></div>)}</div></div>
  </main>;
}
