import { describe, expect, it } from "vitest";

const enabled = process.env.INTEGRATION_TESTS === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("tenant isolation integration", () => {
  it("rejects a cross-organization child/parent relation at the database boundary", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for integration tests");
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });

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
      await prisma.loginRateLimit.deleteMany({ where: { key: { contains: "login:" } } });
    await prisma.$disconnect();
    }
  });
});
