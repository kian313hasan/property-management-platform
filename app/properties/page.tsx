import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/authorization/organization";

const typeLabels: Record<string, string> = {
  RESIDENTIAL: "سكني",
  COMMERCIAL: "تجاري",
  MIXED: "مختلط",
  OTHER: "أخرى",
};

export default async function PropertiesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const context = await requireOrganizationContext();

  const properties = await prisma.property.findMany({
    where: context.role === "PROPERTY_MANAGER" ? { organizationId: context.organizationId, managerId: session.user.id } : { organizationId: context.organizationId },
    include: { _count: { select: { units: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div><p className="text-xs font-semibold text-slate-400">PROPERTY MANAGEMENT PLATFORM</p><h1 className="text-xl font-bold">العقارات</h1></div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">لوحة التحكم</Link>
            {(context.role === "SUPER_ADMIN" || context.role === "PROPERTY_MANAGER") && (
              <Link href="/properties/new" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">+ إضافة عقار</Link>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {properties.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-bold">لا توجد عقارات بعد</h2>
            <p className="mt-2 text-sm text-slate-500">ابدأ بإضافة أول عقار إلى النظام.</p>
            {(context.role === "SUPER_ADMIN" || context.role === "PROPERTY_MANAGER") && <Link href="/properties/new" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">إضافة أول عقار</Link>}
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <article key={property.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-lg font-bold">{property.name}</h2><p className="mt-1 text-sm text-slate-500">{property.city}، {property.country}</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{typeLabels[property.type]}</span>
                </div>
                <p className="mt-4 text-sm text-slate-600">{property.address}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">{property._count.units} وحدة</span>
                  <span className="font-semibold text-emerald-600">نشط</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
