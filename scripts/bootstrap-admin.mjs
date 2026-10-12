import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const organizationName = process.env.BOOTSTRAP_ORGANIZATION_NAME?.trim();
const organizationSlug = (process.env.BOOTSTRAP_ORGANIZATION_SLUG?.trim() || "local-property-management")
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!databaseUrl || !name || name.length < 2 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password || password.length < 12 || !organizationName || organizationName.length < 2 || !organizationSlug) {
  console.error("ضبط DATABASE_URL وبيانات مسؤول المؤسسة في ملف .env أولاً. كلمة المرور يجب أن تكون 12 حرفاً على الأقل.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

try {
  const [userCount, organizationCount] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
  ]);
  if (userCount !== 0 || organizationCount !== 0) {
    console.error("تم إيقاف الإعداد: قاعدة البيانات تحتوي مستخدمين أو مؤسسات بالفعل. هذا الأمر يعمل فقط على قاعدة جديدة فارغة.");
    process.exitCode = 1;
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: organizationName, slug: organizationSlug },
      });
      const user = await tx.user.create({
        data: { name, email, password: passwordHash, role: "SUPER_ADMIN" },
      });
      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: user.id, role: "SUPER_ADMIN" },
      });
    });
    console.log("تم إنشاء المؤسسة وحساب المسؤول الأول بنجاح. سجّل الدخول بالبريد المحدد في .env.");
  }
} catch {
  console.error("تعذر إنشاء حساب المسؤول الأول. تحقق من إعدادات قاعدة البيانات ومن أن البريد واسم المؤسسة غير مستخدمين.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
