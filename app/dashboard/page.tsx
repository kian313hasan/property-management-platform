import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const stats = [["العقارات","—"],["المستأجرون","—"],["العقود النشطة","—"],["الدفعات","—"]];

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><p className="text-xs font-semibold text-slate-400">PROPERTY MANAGEMENT PLATFORM</p><h1 className="text-xl font-bold">لوحة التحكم</h1></div><form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">تسجيل الخروج</button></form></div></header>
      <div className="mx-auto max-w-7xl px-6 py-8"><section className="mb-8 rounded-3xl bg-slate-900 p-7 text-white"><p className="text-sm text-slate-300">مرحباً، {session.user.name || session.user.email}</p><h2 className="mt-2 text-3xl font-bold">إدارة عقاراتك من مكان واحد.</h2><p className="mt-3 text-sm text-slate-300">البنية الأمنية جاهزة. سنبدأ الآن بربط العقارات والمستأجرين والعقود والدفعات بقاعدة البيانات.</p></section>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label,value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></article>)}</section></div>
    </main>
  );
}
