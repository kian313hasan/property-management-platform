import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { updateUserRole } from "@/actions/users";

const roles = ["SUPER_ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT", "MAINTENANCE_MANAGER", "STAFF", "TENANT"] as const;

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const context = await requireOrganizationContext();
  if (context.role !== "SUPER_ADMIN") redirect("/dashboard");

  const memberships = await prisma.organizationMember.findMany({
    where: { organizationId: context.organizationId },
    select: {
      userId: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold text-slate-400">PROPERTY MANAGEMENT PLATFORM</p>
            <h1 className="text-xl font-bold">إدارة المستخدمين</h1>
          </div>
          <Link href="/admin/users/new" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            + إضافة مستخدم
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-right text-sm">
            <thead className="border-b bg-slate-50">
              <tr><th className="p-4">الاسم</th><th className="p-4">البريد</th><th className="p-4">الدور</th><th className="p-4">إجراء</th></tr>
            </thead>
            <tbody>
              {memberships.map((membership) => (
                <tr key={membership.userId} className="border-b last:border-0">
                  <td className="p-4 font-semibold">{membership.user.name ?? "—"}</td>
                  <td className="p-4">{membership.user.email ?? "—"}</td>
                  <td className="p-4">{membership.role}</td>
                  <td className="p-4">
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={membership.userId} />
                      <select name="role" defaultValue={membership.role} className="rounded-lg border px-3 py-2">
                        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                      <button type="submit" className="rounded-lg border px-3 py-2 font-semibold">حفظ</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
