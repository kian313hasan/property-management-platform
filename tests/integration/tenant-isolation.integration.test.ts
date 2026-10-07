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
        await prisma.loginRateLimit.deleteMany();
      await prisma.$disconnect();
    }
  });

  it("enforces the persistent login rate limit and clears it after success", async () => {
    const { checkLoginRateLimit, clearLoginRateLimit } = await import("@/lib/security/login-rate-limit");
    const email = `rate-limit-${Date.now()}@example.test`;
    const ip = undefined;

    await clearLoginRateLimit(email, ip);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect(await checkLoginRateLimit(email, ip)).toBe(false);
    }
    expect(await checkLoginRateLimit(email, ip)).toBe(true);

    await clearLoginRateLimit(email, ip);
    expect(await checkLoginRateLimit(email, ip)).toBe(false);
  });
});
