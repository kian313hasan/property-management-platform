import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestPrisma, integrationEnabled, type TestPrisma } from "./helpers";

describe.skipIf(!integrationEnabled)("audit log is append-only", () => {
  let prisma: TestPrisma;
  const suffix = Date.now().toString();
  const orgIds: string[] = [];
  const userIds: string[] = [];
  const logIds: string[] = [];

  beforeAll(async () => {
    prisma = await createTestPrisma();
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  async function seedEntry() {
    const org = await prisma.organization.create({ data: { name: `Audit ${suffix}`, slug: `audit-${suffix}-${orgIds.length}` } });
    const user = await prisma.user.create({ data: { email: `audit-${suffix}-${userIds.length}@example.test`, password: "not-a-real-hash" } });
    orgIds.push(org.id);
    userIds.push(user.id);
    const entry = await prisma.auditLog.create({
      data: { organizationId: org.id, actorUserId: user.id, action: "RESOURCE_CREATED", resourceType: "Test", resourceId: "r1", requestId: `req-${suffix}`, metadata: { a: 1 } },
    });
    logIds.push(entry.id);
    return { org, user, entry };
  }

  it("rejects changing any column of an existing entry", async () => {
    const { entry } = await seedEntry();
    await expect(prisma.auditLog.update({ where: { id: entry.id }, data: { action: "LOGIN" } })).rejects.toThrow();
    await expect(prisma.auditLog.update({ where: { id: entry.id }, data: { metadata: { a: 2 } } })).rejects.toThrow();
    await expect(prisma.auditLog.updateMany({ where: { id: entry.id }, data: { requestId: "tampered" } })).rejects.toThrow();
    const stored = await prisma.auditLog.findUniqueOrThrow({ where: { id: entry.id } });
    expect(stored.action).toBe("RESOURCE_CREATED");
    expect(stored.requestId).toBe(`req-${suffix}`);
  });

  it("rejects re-attributing an entry to a different organization or actor", async () => {
    const { entry } = await seedEntry();
    const other = await seedEntry();
    await expect(prisma.auditLog.update({ where: { id: entry.id }, data: { organizationId: other.org.id } })).rejects.toThrow();
    await expect(prisma.auditLog.update({ where: { id: entry.id }, data: { actorUserId: other.user.id } })).rejects.toThrow();
  });

  it("rejects deleting entries", async () => {
    const { entry } = await seedEntry();
    await expect(prisma.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow();
    await expect(prisma.auditLog.deleteMany({ where: { id: entry.id } })).rejects.toThrow();
    expect(await prisma.auditLog.count({ where: { id: entry.id } })).toBe(1);
  });

  it("rejects TRUNCATE (rolled back even if it were allowed)", async () => {
    await seedEntry();
    const outcome = await prisma
      .$transaction(async (tx) => {
        await tx.$executeRawUnsafe('TRUNCATE TABLE "AuditLog"');
        throw new Error("rollback-sentinel");
      })
      .then(
        () => "resolved",
        (error: unknown) => (error instanceof Error ? error.message : String(error)),
      );
    expect(outcome).not.toBe("resolved");
    expect(outcome).not.toContain("rollback-sentinel");
  });

  it("keeps the entry (with the reference nulled) when its organization and user are deleted", async () => {
    const { org, user, entry } = await seedEntry();
    await prisma.organization.delete({ where: { id: org.id } });
    await prisma.user.delete({ where: { id: user.id } });
    const stored = await prisma.auditLog.findUniqueOrThrow({ where: { id: entry.id } });
    expect(stored.organizationId).toBeNull();
    expect(stored.actorUserId).toBeNull();
    expect(stored.action).toBe("RESOURCE_CREATED");
    expect(stored.requestId).toBe(`req-${suffix}`);
  });
});
