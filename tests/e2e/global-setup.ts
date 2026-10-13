import { E2E_PASSWORD, seedNames } from "./seed";

/**
 * Creates two organizations, users with different roles and one property in the *other* organization.
 * Needs DATABASE_URL and migrated tables (CI provides both). Without a database the DB-backed specs
 * skip themselves and only the public smoke checks run.
 */
export default async function globalSetup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("[e2e] DATABASE_URL is not set: database-backed E2E specs will be skipped.");
    return;
  }

  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const bcrypt = await import("bcryptjs");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const suffix = Date.now().toString();
    const names = seedNames(suffix);
    const password = await bcrypt.hash(E2E_PASSWORD, 4);

    const [orgA, orgB] = await Promise.all([
      prisma.organization.create({ data: { name: `E2E Organization A ${suffix}`, slug: names.orgA } }),
      prisma.organization.create({ data: { name: `E2E Organization B ${suffix}`, slug: names.orgB } }),
    ]);

    const member = async (email: string, name: string, role: "SUPER_ADMIN" | "ACCOUNTANT" | "STAFF", organizationId: string) => {
      const user = await prisma.user.create({ data: { email, name, password, role } });
      await prisma.organizationMember.create({ data: { organizationId, userId: user.id, role } });
    };
    await member(names.adminEmail, "E2E Admin", "SUPER_ADMIN", orgA.id);
    await member(names.accountantEmail, "E2E Accountant", "ACCOUNTANT", orgA.id);
    await member(names.staffEmail, "E2E Staff", "STAFF", orgA.id);
    await member(names.otherAdminEmail, "E2E Other Admin", "SUPER_ADMIN", orgB.id);

    const foreign = await prisma.property.create({
      data: { organizationId: orgB.id, name: names.foreignPropertyName, address: "Foreign street", city: "Elsewhere", country: "Nowhere" },
    });

    process.env.E2E_SUFFIX = suffix;
    process.env.E2E_FOREIGN_PROPERTY_ID = foreign.id;
  } finally {
    await prisma.$disconnect();
  }
}
