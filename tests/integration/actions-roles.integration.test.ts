import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/actions/types";
import { ROLES, type Role } from "@/lib/authorization/permissions";
import { createTestPrisma, integrationEnabled, type TestPrisma } from "./helpers";

// Server actions normally read the session; the tests replace only that boundary and run the real
// actions against a real PostgreSQL database, so permission, scope and DB constraints are exercised.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/authorization/organization", () => ({
  ACTIVE_ORGANIZATION_COOKIE: "active_organization_id",
  requireOrganizationContext: vi.fn(),
}));

type Outcome = { error?: string; success?: boolean; redirected?: string };
type Action = (formData: FormData) => Promise<ActionState | void>;
type Actor = { id: string; role: Role; organizationId: string };

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function run(action: Action, fields: Record<string, string>): Promise<Outcome> {
  try {
    const result = await action(form(fields));
    return { error: result?.error, success: result?.success };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT:")) return { redirected: error.message.slice("NEXT_REDIRECT:".length) };
    throw error;
  }
}

const DENIED = "actionErrors.noPermission";

describe.skipIf(!integrationEnabled)("server actions by role (real database)", () => {
  const suffix = Date.now().toString();
  let prisma: TestPrisma;
  let counter = 0;
  const unique = (label: string) => `${label}-${suffix}-${++counter}`;
  const orgIds: string[] = [];
  const userIds: string[] = [];

  let setActor: (actor: Actor) => void;
  let actions: {
    createProperty: Action;
    createUnit: Action;
    createTenant: Action;
    createLease: Action;
    createPayment: Action;
    createExpense: Action;
    createMaintenance: Action;
    createUser: Action;
    updateUserRole: Action;
  };

  const actors = {} as Record<"adminA" | "pmA" | "pmA2" | "accA" | "mmA" | "staffA" | "tenantUserA" | "adminB", Actor>;
  const byRole: Record<Role, () => Actor> = {
    SUPER_ADMIN: () => actors.adminA,
    PROPERTY_MANAGER: () => actors.pmA,
    ACCOUNTANT: () => actors.accA,
    MAINTENANCE_MANAGER: () => actors.mmA,
    STAFF: () => actors.staffA,
    TENANT: () => actors.tenantUserA,
  };
  const ids = {} as Record<"orgA" | "orgB" | "propA" | "propA2" | "propB" | "unitA1" | "unitA2" | "unitAvailable" | "tenant" | "leaseA" | "leaseA2", string>;

  beforeAll(async () => {
    prisma = await createTestPrisma();

    const { requireOrganizationContext } = await import("@/lib/authorization/organization");
    const mocked = vi.mocked(requireOrganizationContext);
    setActor = (actor) =>
      mocked.mockResolvedValue({
        userId: actor.id,
        organizationId: actor.organizationId,
        role: actor.role,
        organization: { id: actor.organizationId, name: "test", slug: "test" },
        memberships: [],
      });

    actions = {
      ...(await import("@/actions/properties")),
      ...(await import("@/actions/units")),
      ...(await import("@/actions/tenants")),
      ...(await import("@/actions/leases")),
      ...(await import("@/actions/payments")),
      ...(await import("@/actions/expenses")),
      ...(await import("@/actions/maintenance")),
      ...(await import("@/actions/users")),
    };

    const [orgA, orgB] = await Promise.all([
      prisma.organization.create({ data: { name: unique("Roles A"), slug: unique("roles-a") } }),
      prisma.organization.create({ data: { name: unique("Roles B"), slug: unique("roles-b") } }),
    ]);
    ids.orgA = orgA.id;
    ids.orgB = orgB.id;
    orgIds.push(orgA.id, orgB.id);

    async function member(key: keyof typeof actors, role: Role, organizationId: string) {
      const user = await prisma.user.create({ data: { email: `${unique(key)}@example.test`, password: "not-a-real-hash", role } });
      userIds.push(user.id);
      await prisma.organizationMember.create({ data: { organizationId, userId: user.id, role } });
      actors[key] = { id: user.id, role, organizationId };
    }
    await member("adminA", "SUPER_ADMIN", orgA.id);
    await member("pmA", "PROPERTY_MANAGER", orgA.id);
    await member("pmA2", "PROPERTY_MANAGER", orgA.id);
    await member("accA", "ACCOUNTANT", orgA.id);
    await member("mmA", "MAINTENANCE_MANAGER", orgA.id);
    await member("staffA", "STAFF", orgA.id);
    await member("tenantUserA", "TENANT", orgA.id);
    await member("adminB", "SUPER_ADMIN", orgB.id);

    const property = (organizationId: string, name: string, managerId: string | null) =>
      prisma.property.create({ data: { organizationId, name: unique(name), address: "x", city: "x", country: "x", managerId } });
    const [propA, propA2, propB] = await Promise.all([
      property(orgA.id, "Prop A", actors.pmA.id),
      property(orgA.id, "Prop A2", actors.pmA2.id),
      property(orgB.id, "Prop B", null),
    ]);
    ids.propA = propA.id;
    ids.propA2 = propA2.id;
    ids.propB = propB.id;

    const unit = (propertyId: string, status: "AVAILABLE" | "OCCUPIED") =>
      prisma.unit.create({ data: { organizationId: orgA.id, propertyId, unitNumber: unique("U"), rentAmount: "1000", status } });
    const [unitA1, unitA2, unitAvailable] = await Promise.all([unit(propA.id, "OCCUPIED"), unit(propA2.id, "OCCUPIED"), unit(propA.id, "AVAILABLE")]);
    ids.unitA1 = unitA1.id;
    ids.unitA2 = unitA2.id;
    ids.unitAvailable = unitAvailable.id;

    const tenant = await prisma.tenant.create({ data: { organizationId: orgA.id, name: unique("Tenant") } });
    ids.tenant = tenant.id;

    const lease = (unitId: string) =>
      prisma.lease.create({
        data: { organizationId: orgA.id, unitId, tenantId: tenant.id, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), rentAmount: "1000", status: "ACTIVE" },
      });
    const [leaseA, leaseA2] = await Promise.all([lease(unitA1.id), lease(unitA2.id)]);
    ids.leaseA = leaseA.id;
    ids.leaseA2 = leaseA2.id;
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  beforeEach(() => setActor(actors.adminA));

  /** Runs `action` once per role and checks exactly the listed roles are let through. */
  async function expectRoleMatrix(label: string, action: () => Action, fields: () => Record<string, string>, allowed: readonly Role[], successRedirect: string) {
    for (const role of ROLES) {
      setActor(byRole[role]());
      const outcome = await run(action(), fields());
      if (allowed.includes(role)) expect(outcome, `${label} as ${role}`).toEqual({ redirected: successRedirect });
      else expect(outcome.error, `${label} as ${role}`).toBe(DENIED);
    }
  }

  describe("permission matrix", () => {
    it("createProperty: SUPER_ADMIN and PROPERTY_MANAGER only", async () => {
      await expectRoleMatrix("createProperty", () => actions.createProperty, () => ({ name: unique("P"), address: "Street 1", city: "City", country: "Country", type: "RESIDENTIAL" }), ["SUPER_ADMIN", "PROPERTY_MANAGER"], "/properties");
    });

    it("createTenant: SUPER_ADMIN and PROPERTY_MANAGER only", async () => {
      await expectRoleMatrix("createTenant", () => actions.createTenant, () => ({ name: unique("Tenant") }), ["SUPER_ADMIN", "PROPERTY_MANAGER"], "/tenants");
    });

    it("createUnit on an owned property: SUPER_ADMIN and the owning PROPERTY_MANAGER only", async () => {
      await expectRoleMatrix("createUnit", () => actions.createUnit, () => ({ propertyId: ids.propA, unitNumber: unique("N"), rentAmount: "900" }), ["SUPER_ADMIN", "PROPERTY_MANAGER"], `/properties/${ids.propA}`);
    });

    it("createExpense: SUPER_ADMIN, PROPERTY_MANAGER and ACCOUNTANT", async () => {
      await expectRoleMatrix("createExpense", () => actions.createExpense, () => ({ propertyId: ids.propA, category: "Repairs", amount: "10.50", date: "2026-03-01" }), ["SUPER_ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT"], "/expenses");
    });

    it("createPayment: SUPER_ADMIN, PROPERTY_MANAGER and ACCOUNTANT", async () => {
      await expectRoleMatrix("createPayment", () => actions.createPayment, () => ({ leaseId: ids.leaseA, amount: "500", dueDate: "2026-03-01", status: "PENDING" }), ["SUPER_ADMIN", "PROPERTY_MANAGER", "ACCOUNTANT"], "/payments");
    });

    it("createMaintenance: SUPER_ADMIN, PROPERTY_MANAGER, MAINTENANCE_MANAGER and STAFF", async () => {
      await expectRoleMatrix("createMaintenance", () => actions.createMaintenance, () => ({ propertyId: ids.propA, title: unique("Leak"), priority: "HIGH", status: "OPEN" }), ["SUPER_ADMIN", "PROPERTY_MANAGER", "MAINTENANCE_MANAGER", "STAFF"], "/maintenance");
    });

    it("createUser and updateUserRole: SUPER_ADMIN only", async () => {
      for (const role of ROLES.filter((item) => item !== "SUPER_ADMIN")) {
        setActor(byRole[role]());
        const created = await run(actions.createUser, { name: "Nobody", email: `${unique("nobody")}@example.test`, password: "password-123", role: "STAFF" });
        expect(created.error, `createUser as ${role}`).toBe(DENIED);
        const changed = await run(actions.updateUserRole, { userId: actors.staffA.id, role: "ACCOUNTANT" });
        expect(changed.error, `updateUserRole as ${role}`).toBe(DENIED);
      }
      setActor(actors.adminA);
      const email = `${unique("new")}@example.test`;
      const ok = await run(actions.createUser, { name: "New Staff", email, password: "password-123", role: "STAFF" });
      expect(ok).toEqual({ error: undefined, success: true });
      userIds.push((await prisma.user.findUniqueOrThrow({ where: { email } })).id);
    });

    it("createLease: only SUPER_ADMIN and PROPERTY_MANAGER may even try", async () => {
      const fields = { unitId: ids.unitAvailable, tenantId: ids.tenant, startDate: "2026-01-01", endDate: "2026-12-31", rentAmount: "1000", paymentDueDay: "1" };
      for (const role of ROLES.filter((item) => item !== "SUPER_ADMIN" && item !== "PROPERTY_MANAGER")) {
        setActor(byRole[role]());
        expect((await run(actions.createLease, fields)).error, `createLease as ${role}`).toBe(DENIED);
      }
    });
  });

  describe("organization and ownership isolation", () => {
    it("a manager cannot add units to a property managed by someone else", async () => {
      setActor(actors.pmA2);
      expect((await run(actions.createUnit, { propertyId: ids.propA, unitNumber: unique("X"), rentAmount: "1" })).error).toBe("actionErrors.propertyNotAccessible");
    });

    it("an admin of another organization cannot touch this organization's property, unit, lease or tenant", async () => {
      setActor(actors.adminB);
      expect((await run(actions.createUnit, { propertyId: ids.propA, unitNumber: unique("X"), rentAmount: "1" })).error).toBe("actionErrors.propertyNotAccessible");
      expect((await run(actions.createExpense, { propertyId: ids.propA, category: "Repairs", amount: "1", date: "2026-03-01" })).error).toBe("actionErrors.propertyNotAccessible");
      expect((await run(actions.createMaintenance, { propertyId: ids.propA, title: "Hacked", priority: "LOW", status: "OPEN" })).error).toBe("actionErrors.propertyNotAccessible");
      expect((await run(actions.createPayment, { leaseId: ids.leaseA, amount: "1", dueDate: "2026-03-01", status: "PENDING" })).error).toBe("actionErrors.leaseNotFound");
      expect((await run(actions.createLease, { unitId: ids.unitAvailable, tenantId: ids.tenant, startDate: "2026-01-01", endDate: "2026-12-31", rentAmount: "1", paymentDueDay: "1" })).error).toBe("actionErrors.unitNotAccessible");
    });

    it("a manager cannot record payments, leases or maintenance for another manager's property", async () => {
      setActor(actors.pmA2);
      expect((await run(actions.createPayment, { leaseId: ids.leaseA, amount: "1", dueDate: "2026-03-01", status: "PENDING" })).error).toBe("actionErrors.leaseNotFound");
      expect((await run(actions.createLease, { unitId: ids.unitAvailable, tenantId: ids.tenant, startDate: "2026-01-01", endDate: "2026-12-31", rentAmount: "1", paymentDueDay: "1" })).error).toBe("actionErrors.unitNotAccessible");
      expect((await run(actions.createMaintenance, { propertyId: ids.propA, title: "Nope", priority: "LOW", status: "OPEN" })).error).toBe("actionErrors.propertyNotAccessible");
      setActor(actors.pmA);
      expect((await run(actions.createMaintenance, { propertyId: ids.propA2, title: "Nope", priority: "LOW", status: "OPEN" })).error).toBe("actionErrors.propertyNotAccessible");
    });

    it("a manager can create a lease on an owned unit, and the unit cannot be leased twice", async () => {
      setActor(actors.pmA);
      const fields = { unitId: ids.unitAvailable, tenantId: ids.tenant, startDate: "2026-01-01", endDate: "2026-12-31", rentAmount: "1000.00", depositAmount: "0", paymentDueDay: "5" };
      expect(await run(actions.createLease, fields)).toEqual({ redirected: "/leases" });
      expect((await prisma.unit.findUniqueOrThrow({ where: { id: ids.unitAvailable } })).status).toBe("OCCUPIED");
      expect((await run(actions.createLease, fields)).error).toBe("actionErrors.activeLeaseExists");
    });

    it("staff are always the assignee of their own requests, whatever the client sends", async () => {
      setActor(actors.staffA);
      const title = unique("Staff request");
      expect(await run(actions.createMaintenance, { propertyId: ids.propA, title, priority: "LOW", status: "OPEN", assignedToId: actors.mmA.id })).toEqual({ redirected: "/maintenance" });
      const stored = await prisma.maintenanceRequest.findFirstOrThrow({ where: { organizationId: ids.orgA, title } });
      expect(stored.assignedToId).toBe(actors.staffA.id);
    });

    it("an assignee must be maintenance staff of the same organization", async () => {
      setActor(actors.adminA);
      expect((await run(actions.createMaintenance, { propertyId: ids.propA, title: unique("Bad assignee"), priority: "LOW", status: "OPEN", assignedToId: actors.accA.id })).error).toBe("actionErrors.assigneeInvalid");
      expect((await run(actions.createMaintenance, { propertyId: ids.propA, title: unique("Foreign assignee"), priority: "LOW", status: "OPEN", assignedToId: actors.adminB.id })).error).toBe("actionErrors.assigneeInvalid");
    });

    it("new users join the caller's organization, never one named by the client", async () => {
      setActor(actors.adminB);
      const email = `${unique("joined")}@example.test`;
      expect(await run(actions.createUser, { name: "Joined User", email, password: "password-123", role: "STAFF", organizationId: ids.orgA })).toEqual({ error: undefined, success: true });
      const memberships = await prisma.organizationMember.findMany({ where: { user: { email } } });
      expect(memberships.map((item) => item.organizationId)).toEqual([ids.orgB]);
      const created = await prisma.user.findUniqueOrThrow({ where: { email } });
      userIds.push(created.id);
    });

    it("role changes are limited to members of the caller's organization and cannot demote oneself", async () => {
      setActor(actors.adminB);
      expect((await run(actions.updateUserRole, { userId: actors.pmA.id, role: "STAFF" })).error).toBe("actionErrors.notMember");
      setActor(actors.adminA);
      expect((await run(actions.updateUserRole, { userId: actors.adminA.id, role: "STAFF" })).error).toBe("actionErrors.cannotDemoteSelf");
      expect((await run(actions.updateUserRole, { userId: actors.pmA2.id, role: "NOT_A_ROLE" })).error).toBe("actionErrors.invalidRole");
    });
  });

  describe("validation and money", () => {
    it("rejects malformed money, dates and inconsistent payments", async () => {
      setActor(actors.adminA);
      const expense = (amount: string, date = "2026-03-01") => run(actions.createExpense, { propertyId: ids.propA, category: "Repairs", amount, date });
      for (const amount of ["12.345", "0", "-1", "abc", "1,5", "1e3"]) expect((await expense(amount)).error, amount).toBe("actionErrors.moneyInvalid");
      expect((await expense("5", "2026-02-30")).error).toBe("actionErrors.dateInvalid");
      expect((await run(actions.createPayment, { leaseId: ids.leaseA, amount: "5", dueDate: "2026-03-01", status: "PAID" })).error).toBe("actionErrors.paidDateRequired");
      expect((await run(actions.createLease, { unitId: ids.unitAvailable, tenantId: ids.tenant, startDate: "2026-05-01", endDate: "2026-04-01", rentAmount: "1", paymentDueDay: "1" })).error).toBe("actionErrors.endBeforeStart");
    });

    it("stores money exactly: 0.10 + 0.20 sums to 0.3 with no floating point error", async () => {
      setActor(actors.adminA);
      const property = await prisma.property.create({ data: { organizationId: ids.orgA, name: unique("Money"), address: "x", city: "x", country: "x" } });
      for (const amount of ["0.10", "0.20"]) {
        expect(await run(actions.createExpense, { propertyId: property.id, category: "Exact", amount, date: "2026-03-01" })).toEqual({ redirected: "/expenses" });
      }
      const total = await prisma.expense.aggregate({ where: { propertyId: property.id }, _sum: { amount: true } });
      expect(total._sum.amount?.toString()).toBe("0.3");
    });
  });

  describe("audit trail", () => {
    it("records who created a property and in which organization, and who changed a role", async () => {
      setActor(actors.adminA);
      const name = unique("Audited");
      expect(await run(actions.createProperty, { name, address: "Street 1", city: "City", country: "Country", type: "MIXED" })).toEqual({ redirected: "/properties" });
      const property = await prisma.property.findFirstOrThrow({ where: { organizationId: ids.orgA, name } });
      const created = await prisma.auditLog.findFirstOrThrow({ where: { resourceType: "Property", resourceId: property.id } });
      expect(created).toMatchObject({ action: "RESOURCE_CREATED", actorUserId: actors.adminA.id, organizationId: ids.orgA });

      expect(await run(actions.updateUserRole, { userId: actors.pmA2.id, role: "ACCOUNTANT" })).toEqual({ error: undefined, success: true });
      const membership = await prisma.organizationMember.findUniqueOrThrow({ where: { organizationId_userId: { organizationId: ids.orgA, userId: actors.pmA2.id } } });
      const changed = await prisma.auditLog.findFirstOrThrow({ where: { action: "ROLE_CHANGED", resourceId: membership.id } });
      expect(changed.actorUserId).toBe(actors.adminA.id);
      expect(changed.metadata).toMatchObject({ previousRole: "PROPERTY_MANAGER", newRole: "ACCOUNTANT" });
      // restore for any later test
      await prisma.organizationMember.update({ where: { id: membership.id }, data: { role: "PROPERTY_MANAGER" } });
    });
  });
});
