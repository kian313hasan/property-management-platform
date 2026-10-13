import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { hasPermission, type Permission } from "@/lib/authorization/permissions";

/**
 * Guard for server-rendered pages: authenticated, member of an organization and (optionally) granted
 * `permission`. Unauthenticated users go to /login; users lacking the permission go to `fallbackHref`.
 * The proxy only does a coarse login check, so every page must call this (deny by default).
 */
export async function requirePageAccess(permission?: Permission, fallbackHref = "/dashboard") {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const context = await requireOrganizationContext();
  if (permission && !hasPermission(context.role, permission)) redirect(fallbackHref);
  return { ...context, user: session.user };
}
