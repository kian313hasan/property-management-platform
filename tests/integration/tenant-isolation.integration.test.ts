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

  it("creates a hashed single-use password reset token and invalidates it after reset", async () => {
    const { requestPasswordReset, consumePasswordReset } = await import("@/lib/security/password-reset");
    const bcrypt = await import("bcryptjs");
    const email = `password-reset-${Date.now()}@example.test`;

    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for integration tests");
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

    try {
      const user = await db.user.create({
        data: {
          email,
          password: await bcrypt.hash("old-password-123", 12),
          role: "STAFF",
        },
      });

      const rawToken = await requestPasswordReset(email);
      expect(rawToken).toEqual(expect.any(String));

      const stored = await db.passwordResetToken.findFirst({ where: { userId: user.id } });
      expect(stored?.tokenHash).toBeTruthy();
      expect(stored?.tokenHash).not.toBe(rawToken);

      expect(await consumePasswordReset(rawToken!, "new-password-123")).toBe(true);
      expect(await consumePasswordReset(rawToken!, "another-password-123")).toBe(false);

      const updated = await db.user.findUnique({ where: { id: user.id }, select: { password: true } });
      expect(updated).not.toBeNull();
      expect(await bcrypt.compare("new-password-123", updated!.password)).toBe(true);
    } finally {
      await db.user.deleteMany({ where: { email } });
      await db.$disconnect();
    }
  });

});
