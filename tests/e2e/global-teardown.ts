/** Removes everything global-setup created (organizations cascade to their business data). */
export default async function globalTeardown() {
  const suffix = process.env.E2E_SUFFIX;
  const connectionString = process.env.DATABASE_URL;
  if (!suffix || !connectionString) return;

  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await prisma.organization.deleteMany({ where: { slug: { in: [`e2e-a-${suffix}`, `e2e-b-${suffix}`] } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: "e2e-", endsWith: `-${suffix}@example.test` } } });
  } finally {
    await prisma.$disconnect();
  }
}
