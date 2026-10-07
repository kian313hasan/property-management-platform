import { describe, expect, it } from "vitest";

const enabled = process.env.INTEGRATION_TESTS === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("tenant isolation integration", () => {
  it("rejects a cross-organization child/parent relation at the database boundary", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const suffix = Date.now().toString();
    try {
      const [orgA, orgB] = await Promise.all([
        prisma.organization.create({ data: { name: `Integration A ${suffix}`, slug: `integration-a-${suffix}` } }),
        prisma.organization.create({ data: { name: `Integration B ${suffix}`, slug: `integration-b-${suffix}` } }),
      ]);

      const property = await prisma.property.create({
        data: {
          organizationId: orgA.id,
          name: "Org A Property",
          address: "Test",
          city: "Test",
          country: "Test",
        },
      });

      await expect(
        prisma.unit.create({
          data: {
            organizationId: orgB.id,
            propertyId: property.id,
            unitNumber: "X-1",
            rentAmount: 1000,
          },
        }),
      ).rejects.toThrow();

      await prisma.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    } finally {
      await prisma.$disconnect();
    }
  });
});
