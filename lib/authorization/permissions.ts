/**
 * Single source of truth for role -> permission grants.
 *
 * - Authentication proves *who* the caller is; this matrix answers *what* a role may do.
 * - The role comes from the server-verified OrganizationMember row, never from the client.
 * - Permissions say nothing about *which* records: organization boundaries and resource ownership
 *   (e.g. a PROPERTY_MANAGER only touches properties they manage) are enforced in the queries.
 * - Anything not listed here is denied.
 *
 * The Prisma `PermissionKey` enum mirrors PERMISSIONS (`properties:manage` <-> `PROPERTIES_MANAGE`);
 * tests/unit/permissions.test.ts keeps both in sync.
 */
export const ROLES = ["SUPER_ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT", "MAINTENANCE_MANAGER", "STAFF", "TENANT"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "organization:read",
  "organization:manage",
  "users:read",
  "users:manage",
  "properties:read",
  "properties:manage",
  "finance:read",
  "finance:manage",
  "maintenance:read",
  "maintenance:manage",
  "reports:read",
  "audit:read",
  "files:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  SUPER_ADMIN: PERMISSIONS,
  PROPERTY_MANAGER: [
    "organization:read",
    "properties:read",
    "properties:manage",
    "finance:read",
    "finance:manage",
    "maintenance:read",
    "maintenance:manage",
    "reports:read",
    "files:manage",
  ],
  ACCOUNTANT: ["organization:read", "finance:read", "finance:manage", "reports:read"],
  MAINTENANCE_MANAGER: ["organization:read", "maintenance:read", "maintenance:manage"],
  STAFF: ["organization:read", "maintenance:read", "maintenance:manage"],
  TENANT: [],
};

export function getPermissions(role: Role | undefined): readonly Permission[] {
  return role ? ROLE_PERMISSIONS[role] : [];
}

export function hasPermission(role: Role | undefined, permission: Permission): boolean {
  return getPermissions(role).includes(permission);
}
