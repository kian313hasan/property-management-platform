import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS, getPermissions, hasPermission } from "@/lib/authorization/permissions";
import { requireRolePermission } from "@/lib/authorization/policy";

const schema = readFileSync(path.resolve(__dirname, "../../prisma/schema.prisma"), "utf8");

function enumValues(name: string): string[] {
  const match = new RegExp(`enum ${name} \\{([^}]*)\\}`).exec(schema);
  if (!match?.[1]) throw new Error(`enum ${name} not found in schema.prisma`);
  return match[1].split("\n").map((line) => line.trim()).filter(Boolean);
}

describe("permission matrix", () => {
  it("keeps the Prisma PermissionKey enum in sync with PERMISSIONS", () => {
    const fromCode = PERMISSIONS.map((permission) => permission.replace(":", "_").toUpperCase()).sort();
    expect(enumValues("PermissionKey").sort()).toEqual(fromCode);
  });

  it("keeps the Prisma Role enum in sync with ROLES", () => {
    expect(enumValues("Role").sort()).toEqual([...ROLES].sort());
  });

  it("grants SUPER_ADMIN every permission", () => {
    expect([...getPermissions("SUPER_ADMIN")].sort()).toEqual([...PERMISSIONS].sort());
  });

  it("only grants permissions that exist", () => {
    for (const role of ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) expect(PERMISSIONS).toContain(permission);
    }
  });

  it("denies everything to TENANT and to an unknown role (deny by default)", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission("TENANT", permission)).toBe(false);
      expect(hasPermission(undefined, permission)).toBe(false);
    }
  });

  it("does not let non-admin roles manage users or read audit logs", () => {
    for (const role of ROLES.filter((item) => item !== "SUPER_ADMIN")) {
      expect(hasPermission(role, "users:manage")).toBe(false);
      expect(hasPermission(role, "audit:read")).toBe(false);
    }
  });

  it("keeps accountants out of property and maintenance management", () => {
    expect(hasPermission("ACCOUNTANT", "finance:manage")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "properties:manage")).toBe(false);
    expect(hasPermission("ACCOUNTANT", "maintenance:manage")).toBe(false);
  });

  it("requireRolePermission throws FORBIDDEN when the role lacks the permission", () => {
    expect(() => requireRolePermission("STAFF", "finance:manage")).toThrow(/permission/i);
    expect(() => requireRolePermission("PROPERTY_MANAGER", "properties:manage")).not.toThrow();
  });
});
