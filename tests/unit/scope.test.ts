import { describe, expect, it } from "vitest";
import {
  expenseScope,
  leaseScope,
  maintenanceScope,
  paymentScope,
  propertyScope,
  tenantScope,
  unitScope,
} from "@/lib/authorization/scope";

const base = { organizationId: "org-a", userId: "user-1" };

describe("propertyScope", () => {
  it("limits a property manager to their own properties inside the organization", () => {
    expect(propertyScope({ ...base, role: "PROPERTY_MANAGER" })).toEqual({ organizationId: "org-a", managerId: "user-1" });
  });

  it("scopes every other role to the organization only", () => {
    for (const role of ["SUPER_ADMIN", "ACCOUNTANT", "MAINTENANCE_MANAGER", "STAFF", "TENANT"] as const) {
      expect(propertyScope({ ...base, role })).toEqual({ organizationId: "org-a" });
    }
  });
});

describe("other resource scopes", () => {
  const manager = { ...base, role: "PROPERTY_MANAGER" } as const;
  const admin = { ...base, role: "SUPER_ADMIN" } as const;
  const staff = { ...base, role: "STAFF" } as const;
  const everyScope = [tenantScope, unitScope, leaseScope, paymentScope, expenseScope, maintenanceScope];

  it("always pins the organization taken from the server context", () => {
    for (const scope of everyScope) {
      for (const context of [manager, admin, staff]) expect(scope(context).organizationId, scope.name).toBe("org-a");
    }
  });

  it("restricts managers to their own properties for every property-owned resource", () => {
    for (const scope of [unitScope, leaseScope, paymentScope, expenseScope, maintenanceScope]) {
      expect(JSON.stringify(scope(manager)), scope.name).toContain('"managerId":"user-1"');
      expect(JSON.stringify(scope(admin)), scope.name).not.toContain("managerId");
    }
  });

  it("shows staff only the maintenance requests assigned to them", () => {
    expect(maintenanceScope(staff)).toEqual({ organizationId: "org-a", assignedToId: "user-1" });
  });

  it("lets a manager see tenants without leases or tenants leasing their properties", () => {
    const where = tenantScope(manager);
    expect(where.OR).toHaveLength(2);
    expect(tenantScope(admin)).toEqual({ organizationId: "org-a" });
  });
});
