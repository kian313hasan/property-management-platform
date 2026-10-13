import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS, ROLES, hasPermission, type Permission, type Role } from "@/lib/authorization/permissions";

type Ctx = { userId: string; organizationId: string; role: Role };

const mocks = vi.hoisted(() => {
  const model = () => ({ findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() });
  return {
    ctx: { current: { userId: "user-1", organizationId: "org-a", role: "SUPER_ADMIN" } as { userId: string; organizationId: string; role: string } },
    prisma: {
      property: model(),
      unit: model(),
      tenant: model(),
      lease: model(),
      payment: model(),
      expense: model(),
      maintenanceRequest: model(),
      organizationMember: model(),
      user: model(),
      $transaction: vi.fn(),
    },
    audit: vi.fn(),
    cookieSet: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/authorization/organization", () => ({
  requireOrganizationContext: async () => mocks.ctx.current,
  ACTIVE_ORGANIZATION_COOKIE: "active_organization_id",
}));
vi.mock("@/lib/audit/resource", () => ({ auditResourceChange: mocks.audit }));
vi.mock("@/lib/audit/service", () => ({ recordAuditEvent: mocks.audit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.cookieSet, get: () => undefined }) }));

import { createExpense } from "@/actions/expenses";
import { createLease } from "@/actions/leases";
import { createMaintenance } from "@/actions/maintenance";
import { switchOrganization } from "@/actions/organization";
import { createPayment } from "@/actions/payments";
import { createProperty } from "@/actions/properties";
import { createTenant } from "@/actions/tenants";
import { createUnit } from "@/actions/units";
import { createUser, updateUserRole } from "@/actions/users";

const as = (role: Role): Ctx => ({ userId: "user-1", organizationId: "org-a", role });
const useRole = (role: Role) => {
  mocks.ctx.current = as(role);
};
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const redirectOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("REDIRECT:")) return error.message.slice("REDIRECT:".length);
    throw error;
  }
  return undefined;
};
const writes = () => {
  const { $transaction, ...models } = mocks.prisma;
  return [$transaction, ...Object.values(models).flatMap((model) => [model.create, model.update, model.updateMany])];
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries(mocks.prisma)) {
    if (key === "$transaction") continue;
    const model = value as typeof mocks.prisma.property;
    model.findFirst.mockResolvedValue(null);
    model.findUnique.mockResolvedValue(null);
  }
});

type ActionCase = { name: string; run: (data: FormData) => Promise<unknown>; permission: Permission };
const actionCases: ActionCase[] = [
  { name: "createProperty", run: createProperty, permission: "properties:manage" },
  { name: "createUnit", run: createUnit, permission: "properties:manage" },
  { name: "createTenant", run: createTenant, permission: "properties:manage" },
  { name: "createLease", run: createLease, permission: "properties:manage" },
  { name: "createPayment", run: createPayment, permission: "finance:manage" },
  { name: "createExpense", run: createExpense, permission: "finance:manage" },
  { name: "createMaintenance", run: createMaintenance, permission: "maintenance:manage" },
  { name: "createUser", run: createUser, permission: "users:manage" },
  { name: "updateUserRole", run: updateUserRole, permission: "users:manage" },
];

describe("every server action enforces the permission matrix for every role", () => {
  for (const action of actionCases) {
    for (const role of ROLES) {
      const allowed = hasPermission(role, action.permission);
      it(`${action.name} as ${role}: ${allowed ? "passes the permission gate" : "is denied"}`, async () => {
        useRole(role);
        const result = await action.run(new FormData());
        expect(result).toMatchObject({ error: expect.any(String) });
        const error = (result as { error: string }).error;
        if (allowed) expect(error).not.toBe("actionErrors.noPermission");
        else expect(error).toBe("actionErrors.noPermission");
        // Empty input never reaches a write, whatever the role.
        for (const write of writes()) expect(write).not.toHaveBeenCalled();
      });
    }
  }

  it("the matrix covers every permission an action relies on", () => {
    for (const action of actionCases) expect(PERMISSIONS).toContain(action.permission);
  });
});

describe("tenant isolation and ownership inside actions", () => {
  it("createProperty ignores a client-supplied organizationId and assigns a manager's own id", async () => {
    mocks.prisma.property.create.mockResolvedValue({ id: "p1" });
    const fields = { name: "Tower", address: "Main street", city: "City", country: "Country", type: "RESIDENTIAL", organizationId: "org-evil", managerId: "someone-else" };

    useRole("SUPER_ADMIN");
    expect(await redirectOf(createProperty(form(fields)))).toBe("/properties");
    expect(mocks.prisma.property.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ organizationId: "org-a", managerId: null }) });

    useRole("PROPERTY_MANAGER");
    await redirectOf(createProperty(form(fields)));
    expect(mocks.prisma.property.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ organizationId: "org-a", managerId: "user-1" }) });
    expect(mocks.audit).toHaveBeenCalled();
  });

  it("a manager can only add expenses to properties they manage; others are scoped by organization only", async () => {
    const fields = { propertyId: "p-foreign", category: "Repairs", amount: "10.50", date: "2026-01-02" };

    useRole("PROPERTY_MANAGER");
    expect(await createExpense(form(fields))).toEqual({ error: "actionErrors.propertyNotAccessible" });
    expect(mocks.prisma.property.findFirst).toHaveBeenLastCalledWith({ where: { id: "p-foreign", organizationId: "org-a", managerId: "user-1" }, select: { id: true } });
    expect(mocks.prisma.expense.create).not.toHaveBeenCalled();

    useRole("ACCOUNTANT");
    await createExpense(form(fields));
    expect(mocks.prisma.property.findFirst).toHaveBeenLastCalledWith({ where: { id: "p-foreign", organizationId: "org-a" }, select: { id: true } });
  });

  it("createPayment looks the lease up inside the organization (and the manager's properties) and stores money as a string", async () => {
    const fields = { leaseId: "l1", amount: "1500.50", dueDate: "2026-02-01", status: "PENDING" };

    useRole("PROPERTY_MANAGER");
    expect(await createPayment(form(fields))).toEqual({ error: "actionErrors.leaseNotFound" });
    expect(mocks.prisma.lease.findFirst).toHaveBeenLastCalledWith({
      where: { id: "l1", organizationId: "org-a", unit: { property: { managerId: "user-1" } } },
      select: { id: true },
    });
    expect(mocks.prisma.payment.create).not.toHaveBeenCalled();

    mocks.prisma.lease.findFirst.mockResolvedValue({ id: "l1" });
    mocks.prisma.payment.create.mockResolvedValue({ id: "pay1" });
    useRole("ACCOUNTANT");
    expect(await redirectOf(createPayment(form(fields)))).toBe("/payments");
    const data = mocks.prisma.payment.create.mock.calls[0]?.[0]?.data;
    expect(data).toMatchObject({ organizationId: "org-a", leaseId: "l1", amount: "1500.50" });
    expect(typeof data.amount).toBe("string");
  });

  it("createPayment rejects malformed money and a PAID payment without a paid date", async () => {
    useRole("ACCOUNTANT");
    const base = { leaseId: "l1", dueDate: "2026-02-01", status: "PENDING" };
    for (const amount of ["0", "-1", "1.005", "abc", "1e3"]) {
      expect(await createPayment(form({ ...base, amount })), amount).toEqual({ error: "actionErrors.moneyInvalid" });
    }
    expect(await createPayment(form({ ...base, amount: "10", status: "PAID" }))).toEqual({ error: "actionErrors.paidDateRequired" });
    expect(mocks.prisma.payment.create).not.toHaveBeenCalled();
  });

  it("createLease refuses a unit or tenant outside the manager's scope and never writes", async () => {
    const fields = { unitId: "u1", tenantId: "t1", startDate: "2026-01-01", endDate: "2026-12-31", rentAmount: "900", paymentDueDay: "1" };
    useRole("PROPERTY_MANAGER");

    expect(await createLease(form(fields))).toEqual({ error: "actionErrors.unitNotAccessible" });
    expect(mocks.prisma.unit.findFirst).toHaveBeenLastCalledWith({ where: { id: "u1", organizationId: "org-a", property: { managerId: "user-1" } }, select: { id: true } });

    mocks.prisma.unit.findFirst.mockResolvedValue({ id: "u1" });
    expect(await createLease(form(fields))).toEqual({ error: "actionErrors.tenantOutOfScope" });
    expect(await createLease(form({ ...fields, endDate: "2025-12-31" }))).toEqual({ error: "actionErrors.endBeforeStart" });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("staff can only assign maintenance requests to themselves, whatever the form says", async () => {
    mocks.prisma.property.findFirst.mockResolvedValue({ id: "p1" });
    const fields = { propertyId: "p1", title: "Leaking pipe", priority: "HIGH", status: "OPEN", assignedToId: "someone-else" };

    useRole("STAFF");
    expect(await createMaintenance(form(fields))).toEqual({ error: "actionErrors.assigneeInvalid" });
    expect(mocks.prisma.organizationMember.findFirst).toHaveBeenLastCalledWith({
      where: { organizationId: "org-a", userId: "user-1", role: { in: ["STAFF", "MAINTENANCE_MANAGER"] } },
      select: { userId: true },
    });
    expect(mocks.prisma.maintenanceRequest.create).not.toHaveBeenCalled();
  });

  it("a maintenance manager is restricted to assignees that are staff of the same organization", async () => {
    mocks.prisma.property.findFirst.mockResolvedValue({ id: "p1" });
    useRole("MAINTENANCE_MANAGER");
    const result = await createMaintenance(form({ propertyId: "p1", title: "Broken lift", priority: "LOW", status: "OPEN", assignedToId: "accountant-1" }));
    expect(result).toEqual({ error: "actionErrors.assigneeInvalid" });
    expect(mocks.prisma.organizationMember.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-a", userId: "accountant-1" }) }));
  });

  it("createUnit denies a property outside the manager's scope before touching anything else", async () => {
    useRole("PROPERTY_MANAGER");
    expect(await createUnit(form({ propertyId: "p-foreign", unitNumber: "1", rentAmount: "100" }))).toEqual({ error: "actionErrors.propertyNotAccessible" });
    expect(mocks.prisma.property.findFirst).toHaveBeenLastCalledWith({ where: { id: "p-foreign", organizationId: "org-a", managerId: "user-1" }, select: { id: true } });
    expect(mocks.prisma.unit.create).not.toHaveBeenCalled();
  });

  it("createTenant stores the tenant in the caller's organization", async () => {
    mocks.prisma.tenant.create.mockResolvedValue({ id: "t1" });
    useRole("PROPERTY_MANAGER");
    expect(await redirectOf(createTenant(form({ name: "Sara Ali", email: "SARA@Example.com", organizationId: "org-evil" })))).toBe("/tenants");
    expect(mocks.prisma.tenant.create).toHaveBeenCalledWith({ data: expect.objectContaining({ organizationId: "org-a", email: "sara@example.com" }) });
  });
});

describe("user and organization administration", () => {
  it("an admin cannot lower their own role, and cannot change someone outside the organization", async () => {
    useRole("SUPER_ADMIN");
    expect(await updateUserRole(form({ userId: "user-1", role: "STAFF" }))).toEqual({ error: "actionErrors.cannotDemoteSelf" });
    expect(await updateUserRole(form({ userId: "other", role: "STAFF" }))).toEqual({ error: "actionErrors.notMember" });
    expect(mocks.prisma.organizationMember.findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { organizationId_userId: { organizationId: "org-a", userId: "other" } } }),
    );
    expect(await updateUserRole(form({ userId: "other", role: "ROOT" }))).toEqual({ error: "actionErrors.invalidRole" });
    for (const write of writes()) expect(write).not.toHaveBeenCalled();
  });

  it("createUser validates input and refuses an email that already exists", async () => {
    useRole("SUPER_ADMIN");
    expect(await createUser(form({ name: "Sam", email: "nope", password: "longenough", role: "STAFF" }))).toEqual({ error: "actionErrors.emailInvalid" });
    expect(await createUser(form({ name: "Sam", email: "sam@example.com", password: "short", role: "STAFF" }))).toEqual({ error: "actionErrors.passwordInvalid" });
    expect(await createUser(form({ name: "Sam", email: "sam@example.com", password: "longenough", role: "OWNER" }))).toEqual({ error: "actionErrors.invalidRole" });
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "existing" });
    expect(await createUser(form({ name: "Sam", email: "sam@example.com", password: "longenough", role: "STAFF" }))).toEqual({ error: "actionErrors.userExists" });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("switchOrganization only honours organizations the user belongs to", async () => {
    useRole("STAFF");
    expect(await switchOrganization(form({ organizationId: "org-b" }))).toEqual({ error: "actionErrors.noOrganizationAccess" });
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.prisma.organizationMember.findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { organizationId_userId: { organizationId: "org-b", userId: "user-1" } } }),
    );

    mocks.prisma.organizationMember.findUnique.mockResolvedValue({ organizationId: "org-b" });
    expect(await switchOrganization(form({ organizationId: "org-b" }))).toEqual({ success: true });
    expect(mocks.cookieSet).toHaveBeenCalledWith("active_organization_id", "org-b", expect.objectContaining({ httpOnly: true, sameSite: "lax" }));
  });
});
