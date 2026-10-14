import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { E2E_ORG_SLUG, E2E_PASSWORD, E2E_USERS } from "./fixtures";

/**
 * Seeds a throw-away organization with one user per role under test. It is idempotent so the suite
 * can be re-run against the same local database. Only used by the E2E suite; never run in production.
 */
export default async function globalSetup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to run the E2E suite");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const organization = await prisma.organization.upsert({
      where: { slug: E2E_ORG_SLUG },
      update: {},
      create: { name: "E2E Organization", slug: E2E_ORG_SLUG },
    });
    const password = await bcrypt.hash(E2E_PASSWORD, 10);

    for (const user of Object.values(E2E_USERS)) {
      const stored = await prisma.user.upsert({
        where: { email: user.email },
        update: { password, role: user.role, name: user.name },
        create: { email: user.email, name: user.name, password, role: user.role },
      });
      await prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: organization.id, userId: stored.id } },
        update: { role: user.role },
        create: { organizationId: organization.id, userId: stored.id, role: user.role },
      });
    }

    // Earlier failed sign-ins must not lock the seeded accounts out of the suite.
    await prisma.loginRateLimit.deleteMany({});
  } finally {
    await prisma.$disconnect();
  }
}
