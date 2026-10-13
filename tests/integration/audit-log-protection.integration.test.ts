import { describe, expect, it } from "vitest";

const enabled = process.env.INTEGRATION_TESTS === "1" && Boolean(process.env.DATABASE_URL);

describe.skipIf(!enabled)("audit log is append-only at the database level", () => {
  async function connect() {
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required for integration tests");
    return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }

  it("rejects updates and deletes of audit rows, but keeps them when their organization or actor is removed", async () => {
    const prisma = await connect();
    const suffix = Date.now().toString();
    const requestId = `audit-protect-${suffix}`;
    try {
      const org = await prisma.organization.create({ data: { name: `Audit ${suffix}`, slug: `audit-${suffix}` } });
      const user = await prisma.user.create({ data: { email: `audit-${suffix}@example.test`, password: "not-a-real-hash" } });
      const row = await prisma.auditLog.create({
        data: { organizationId: org.id, actorUserId: user.id, action: "LOGIN", resourceType: "AUTH", requestId, metadata: { note: "original" } },
      });

      // Tampering with content, re-attributing or deleting is rejected.
      await expect(prisma.auditLog.update({ where: { id: row.id }, data: { action: "LOGOUT" } })).rejects.toThrow();
      await expect(prisma.auditLog.update({ where: { id: row.id }, data: { metadata: { note: "edited" } } })).rejects.toThrow();
      await expect(prisma.auditLog.update({ where: { id: row.id }, data: { actorUserId: null, action: "LOGOUT" } })).rejects.toThrow();
      await expect(prisma.auditLog.delete({ where: { id: row.id } })).rejects.toThrow();
      await expect(prisma.auditLog.deleteMany({ where: { requestId } })).rejects.toThrow();

      // The row is unchanged.
      const unchanged = await prisma.auditLog.findUniqueOrThrow({ where: { id: row.id } });
      expect(unchanged.action).toBe("LOGIN");
      expect(unchanged.metadata).toEqual({ note: "original" });

      // Removing the organization and the user nulls the references (ON DELETE SET NULL) and must still work.
      await prisma.organization.delete({ where: { id: org.id } });
      await prisma.user.delete({ where: { id: user.id } });
      const orphaned = await prisma.auditLog.findUniqueOrThrow({ where: { id: row.id } });
      expect(orphaned.organizationId).toBeNull();
      expect(orphaned.actorUserId).toBeNull();
      expect(orphaned.action).toBe("LOGIN");
    } finally {
      await prisma.$disconnect();
    }
  });
});
