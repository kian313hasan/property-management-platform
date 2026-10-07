import { AppError } from "@/lib/errors/app-error";
export const ROLES = ["SUPER_ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT", "MAINTENANCE_MANAGER", "STAFF", "TENANT"] as const;
export type Role = (typeof ROLES)[number];
export const PERMISSIONS = ["organization:read", "organization:manage", "users:read", "users:manage", "properties:read", "properties:manage", "finance:read", "finance:manage", "maintenance:read", "maintenance:manage", "reports:read", "audit:read", "files:manage"] as const;
export type Permission = (typeof PERMISSIONS)[number];
export function requireRole(actual: Role | undefined, allowed: readonly Role[]): Role { if (!actual || !allowed.includes(actual)) throw new AppError("FORBIDDEN", "You do not have permission to perform this action."); return actual; }
export function requirePermission(granted: readonly Permission[], permission: Permission): void { if (!granted.includes(permission)) throw new AppError("FORBIDDEN", "You do not have permission to perform this action."); }
export function requireSameOrganization(resourceOrganizationId: string, organizationId: string): void { if (resourceOrganizationId !== organizationId) throw new AppError("FORBIDDEN", "Resource is outside the current organization."); }
