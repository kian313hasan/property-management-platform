import { describe, expect, it } from "vitest";
import { propertyScope } from "@/lib/authorization/scope";

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
