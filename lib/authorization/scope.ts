import type { Prisma } from "@prisma/client";
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

/**
 * Tenants have no direct manager. A PROPERTY_MANAGER sees tenants that have never leased anything in
 * the organization (so a manager can register a tenant and then create their first lease) and tenants
 * leasing a unit in a property they manage. Everyone else sees the whole organization.
 */
export function tenantScope(context: ScopeContext): Prisma.TenantWhereInput {
  if (context.role !== "PROPERTY_MANAGER") return { organizationId: context.organizationId };
  return {
    organizationId: context.organizationId,
    OR: [
      { leases: { none: { organizationId: context.organizationId } } },
      { leases: { some: { organizationId: context.organizationId, unit: { property: { managerId: context.userId } } } } },
    ],
  };
}

export function unitScope(context: ScopeContext): Prisma.UnitWhereInput {
  return context.role === "PROPERTY_MANAGER"
    ? { organizationId: context.organizationId, property: { managerId: context.userId } }
    : { organizationId: context.organizationId };
}

export function leaseScope(context: ScopeContext): Prisma.LeaseWhereInput {
  return context.role === "PROPERTY_MANAGER"
    ? { organizationId: context.organizationId, unit: { property: { managerId: context.userId } } }
    : { organizationId: context.organizationId };
}

export function paymentScope(context: ScopeContext): Prisma.PaymentWhereInput {
  return context.role === "PROPERTY_MANAGER"
    ? { organizationId: context.organizationId, lease: { unit: { property: { managerId: context.userId } } } }
    : { organizationId: context.organizationId };
}

export function expenseScope(context: ScopeContext): Prisma.ExpenseWhereInput {
  return context.role === "PROPERTY_MANAGER"
    ? { organizationId: context.organizationId, property: { managerId: context.userId } }
    : { organizationId: context.organizationId };
}

/** Maintenance: managers see their properties' requests, STAFF only requests assigned to them. */
export function maintenanceScope(context: ScopeContext): Prisma.MaintenanceRequestWhereInput {
  if (context.role === "PROPERTY_MANAGER") return { organizationId: context.organizationId, property: { managerId: context.userId } };
  if (context.role === "STAFF") return { organizationId: context.organizationId, assignedToId: context.userId };
  return { organizationId: context.organizationId };
}
