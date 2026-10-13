import { AppError } from "@/lib/errors/app-error";
import { hasPermission, ROLES, PERMISSIONS, type Permission, type Role } from "@/lib/authorization/permissions";

export { ROLES, PERMISSIONS };
export type { Permission, Role };

function forbidden(): AppError {
  return new AppError("FORBIDDEN", "You do not have permission to perform this action.");
}

export function requireRole(actual: Role | undefined, allowed: readonly Role[]): Role {
  if (!actual || !allowed.includes(actual)) throw forbidden();
  return actual;
}

/** Throws unless the explicit permission list contains `permission`. */
export function requirePermission(granted: readonly Permission[], permission: Permission): void {
  if (!granted.includes(permission)) throw forbidden();
}

/** Throws unless the role's grants (see ROLE_PERMISSIONS) include `permission`. */
export function requireRolePermission(role: Role | undefined, permission: Permission): void {
  if (!hasPermission(role, permission)) throw forbidden();
}

export function requireSameOrganization(resourceOrganizationId: string, organizationId: string): void {
  if (resourceOrganizationId !== organizationId) {
    throw new AppError("FORBIDDEN", "Resource is outside the current organization.");
  }
}
