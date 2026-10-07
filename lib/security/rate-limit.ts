import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function consumeLoginRateLimit(email: string): Promise<boolean> {
  const key = `login:${email.trim().toLowerCase()}`;
  const now = new Date();
  const currentWindow = new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const allowed = await prisma.$transaction(async (tx) => {
        const bucket = await tx.rateLimitBucket.findUnique({ where: { key } });

        if (!bucket || bucket.windowStart.getTime() !== currentWindow.getTime()) {
          await tx.rateLimitBucket.upsert({
            where: { key },
            create: { key, windowStart: currentWindow, count: 1 },
            update: { windowStart: currentWindow, count: 1 },
          });
          return true;
        }

        if (bucket.count >= MAX_ATTEMPTS) return false;

        await tx.rateLimitBucket.update({
          where: { key },
          data: { count: { increment: 1 } },
        });
        return true;
      }, { isolationLevel: "Serializable" });

      return allowed;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  return false;
}
