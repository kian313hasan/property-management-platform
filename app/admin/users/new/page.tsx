import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import NewUserForm from "./new-user-form";

export default async function NewUserPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const context = await requireOrganizationContext();
  if (context.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-slate-50" dir="rtl">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">إضافة مستخدم</h1>
          <Link href="/admin/users" className="rounded-xl border px-4 py-2 text-sm font-semibold">رجوع</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8"><NewUserForm /></div>
    </main>
  );
}
