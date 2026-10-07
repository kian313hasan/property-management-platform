import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { switchOrganization } from "@/actions/organization";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const context = await requireOrganizationContext();
  const isManager = context.role === "PROPERTY_MANAGER";
  const canFinance = ["SUPER_ADMIN","PROPERTY_MANAGER","ACCOUNTANT"].includes(context.role);
  const canMaintenance = ["SUPER_ADMIN","PROPERTY_MANAGER","MAINTENANCE_MANAGER","STAFF"].includes(context.role);
  const propertyWhere = isManager ? { organizationId: context.organizationId, managerId: session.user.id } : { organizationId: context.organizationId };
  const paymentWhere = isManager ? { organizationId: context.organizationId, status: "PAID" as const, lease: { unit: { property: { managerId: session.user.id } } } } : { organizationId: context.organizationId, status: "PAID" as const };
  const expenseWhere = isManager ? { organizationId: context.organizationId, property: { managerId: session.user.id } } : { organizationId: context.organizationId };
  const leaseWhere = isManager ? { organizationId: context.organizationId, status: "ACTIVE" as const, unit: { property: { managerId: session.user.id } } } : { organizationId: context.organizationId, status: "ACTIVE" as const };
  const [propertyCount, tenantCount, activeLeaseCount, paidPaymentCount, revenue, expenses] = await Promise.all([
    prisma.property.count({ where: propertyWhere }),
    prisma.tenant.count({ where: { organizationId: context.organizationId } }),
    prisma.lease.count({ where: leaseWhere }),
    prisma.payment.count({ where: paymentWhere }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: paymentWhere }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: expenseWhere }),
  ]);
  const totalRevenue = revenue._sum.amount?.toNumber() ?? 0;
  const totalExpenses = expenses._sum.amount?.toNumber() ?? 0;
  const netIncome = totalRevenue - totalExpenses;
  const stats = (isManager || context.role === "SUPER_ADMIN") ? [["العقارات", propertyCount], ["المستأجرون", tenantCount], ["العقود النشطة", activeLeaseCount], ["الدفعات المدفوعة", paidPaymentCount]] : canFinance ? [["الدفعات المدفوعة", paidPaymentCount]] : [];
  return <main className="min-h-screen bg-slate-50" dir="rtl">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><p className="text-xs font-semibold text-slate-400">PROPERTY MANAGEMENT PLATFORM</p><h1 className="text-xl font-bold">لوحة التحكم</h1></div><form action={async()=>{ "use server"; await signOut({redirectTo:"/login"});}}><button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">تسجيل الخروج</button></form></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8">
      <section className="mb-8 rounded-3xl bg-slate-900 p-7 text-white"><div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm text-slate-300">المؤسسة: {context.organization.name}</span>
      {context.memberships.length > 1 && (
        <form action={switchOrganization} className="flex items-center gap-2">
          <select name="organizationId" defaultValue={context.organizationId} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
            {context.memberships.map((membership) => (
              <option key={membership.organizationId} value={membership.organizationId}>{membership.organization.name}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900">تبديل</button>
        </form>
      )}
    </div><p className="text-sm text-slate-300">مرحباً، {session.user.name || session.user.email}</p><h2 className="mt-2 text-3xl font-bold">إدارة عقاراتك من مكان واحد.</h2><p className="mt-3 text-sm text-slate-300">نظرة موحدة على العقارات والعقود والتحصيل والمصروفات.</p><div className="mt-5 flex flex-wrap gap-3">{["SUPER_ADMIN","PROPERTY_MANAGER"].includes(context.role)&&<Link href="/properties" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900">العقارات</Link>}{["SUPER_ADMIN","PROPERTY_MANAGER"].includes(context.role)&&<Link href="/tenants" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-white">المستأجرون</Link>}{["SUPER_ADMIN","PROPERTY_MANAGER"].includes(context.role)&&<Link href="/leases" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-white">العقود</Link>}{canFinance&&<><Link href="/payments" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-white">الدفعات</Link><Link href="/expenses" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-white">المصروفات</Link></>}{canMaintenance&&<Link href="/maintenance" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-white">الصيانة</Link>}</div></section>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label,value])=><article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></article>)}</section>
      {canFinance && <section className="mt-6 grid gap-5 md:grid-cols-3"><article className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">الإيرادات المحصلة</p><p className="mt-2 text-2xl font-bold">{totalRevenue.toLocaleString()}</p></article><article className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">المصروفات</p><p className="mt-2 text-2xl font-bold">{totalExpenses.toLocaleString()}</p></article><article className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">صافي الدخل</p><p className="mt-2 text-2xl font-bold">{netIncome.toLocaleString()}</p></article></section>}
    </div></main>;
}