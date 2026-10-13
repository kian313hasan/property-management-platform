import { describe, expect, it } from "vitest";
import { propertyScope } from "@/lib/authorization/scope";

const enabled = process.env.INTEGRATION_TESTS === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("IDOR / organization scoping", () => {
  it("never returns another organization's or another manager's property by id", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for integration tests");
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
    const suffix = Date.now().toString();
    const userData = (label: string) => ({ email: `idor-${label}-${suffix}@example.test`, password: "not-a-real-hash" });
    const orgIds: string[] = [];
    const userIds: string[] = [];

    try {
      const [orgA, orgB] = await Promise.all([
        prisma.organization.create({ data: { name: `IDOR A ${suffix}`, slug: `idor-a-${suffix}` } }),
        prisma.organization.create({ data: { name: `IDOR B ${suffix}`, slug: `idor-b-${suffix}` } }),
      ]);
      orgIds.push(orgA.id, orgB.id);
      const [manager1, manager2] = await Promise.all([
        prisma.user.create({ data: userData("m1") }),
        prisma.user.create({ data: userData("m2") }),
      ]);
      userIds.push(manager1.id, manager2.id);

      const make = (organizationId: string, name: string, managerId: string | null) =>
        prisma.property.create({ data: { organizationId, name, address: "x", city: "x", country: "x", managerId } });
      const [ownA, otherA, inB] = await Promise.all([
        make(orgA.id, "A-managed-by-1", manager1.id),
        make(orgA.id, "A-managed-by-2", manager2.id),
        make(orgB.id, "B-property", null),
      ]);

      const managerInA = { organizationId: orgA.id, userId: manager1.id, role: "PROPERTY_MANAGER" as const };
      const adminInA = { organizationId: orgA.id, userId: "admin", role: "SUPER_ADMIN" as const };
      const adminInB = { organizationId: orgB.id, userId: "admin", role: "SUPER_ADMIN" as const };

      const listIds = async (scope: ReturnType<typeof propertyScope>) =>
        (await prisma.property.findMany({ where: scope, select: { id: true } })).map((row) => row.id).sort();

      expect(await listIds(propertyScope(managerInA))).toEqual([ownA.id]);
      expect(await listIds(propertyScope(adminInA))).toEqual([ownA.id, otherA.id].sort());
      expect(await listIds(propertyScope(adminInB))).toEqual([inB.id]);

      // Guessing a foreign id with a valid session still finds nothing.
      expect(await prisma.property.findFirst({ where: { id: inB.id, ...propertyScope(adminInA) } })).toBeNull();
      expect(await prisma.property.findFirst({ where: { id: otherA.id, ...propertyScope(managerInA) } })).toBeNull();
      expect(await prisma.property.findFirst({ where: { id: ownA.id, ...propertyScope(managerInA) } })).not.toBeNull();
    } finally {
      await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      await prisma.$disconnect();
    }
  });
});
