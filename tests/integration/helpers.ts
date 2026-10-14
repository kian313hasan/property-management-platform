export const integrationEnabled = process.env.INTEGRATION_TESTS === "1" && Boolean(process.env.DATABASE_URL);

/** A standalone Prisma client for test setup/teardown (the app code uses its own singleton). */
export async function createTestPrisma() {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for integration tests");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export type TestPrisma = Awaited<ReturnType<typeof createTestPrisma>>;
