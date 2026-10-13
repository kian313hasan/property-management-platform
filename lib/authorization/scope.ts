import type { Role } from "@/lib/authorization/permissions";

type ScopeContext = { organizationId: string; userId: string; role: Role };

/**
 * Prisma `where` fragment for Property reads and ownership checks.
 *
 * The organization always comes from the server-derived context (never from the client). A
 * PROPERTY_MANAGER is additionally limited to the properties they manage; other roles that may read
 * properties see the whole organization. Combine it with a client-supplied id, e.g.
 * `findFirst({ where: { id, ...propertyScope(context) } })`, so a foreign id yields `null` (IDOR).
 */
export function propertyScope(context: ScopeContext): { organizationId: string; managerId?: string } {
  return context.role === "PROPERTY_MANAGER"
    ? { organizationId: context.organizationId, managerId: context.userId }
    : { organizationId: context.organizationId };
}
