import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000;

function keyHash(kind: "email" | "ip", value: string): string {
  return createHash("sha256")
    .update(`login:${kind}:${value.trim().toLowerCase()}`)
    .digest("hex");
}

async function consume(key: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const blockedUntil = new Date(now.getTime() + BLOCK_MS);

  const rows = await prisma.$queryRaw<Array<{ attempts: number; blockedUntil: Date | null }>>`
    INSERT INTO "LoginRateLimit" ("id", "key", "windowStart", "attempts", "updatedAt")
    VALUES (md5(random()::text || clock_timestamp()::text), ${key}, ${now}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE
    SET
      "windowStart" = CASE
        WHEN "LoginRateLimit"."windowStart" <= ${windowStart} THEN ${now}
        ELSE "LoginRateLimit"."windowStart"
      END,
      "attempts" = CASE
        WHEN "LoginRateLimit"."windowStart" <= ${windowStart} THEN 1
        ELSE "LoginRateLimit"."attempts" + 1
      END,
      "blockedUntil" = CASE
        WHEN "LoginRateLimit"."blockedUntil" > ${now} THEN "LoginRateLimit"."blockedUntil"
        WHEN "LoginRateLimit"."windowStart" <= ${windowStart} THEN NULL
        WHEN "LoginRateLimit"."attempts" + 1 > ${MAX_ATTEMPTS} THEN ${blockedUntil}
        ELSE NULL
      END,
      "updatedAt" = ${now}
    RETURNING "attempts", "blockedUntil"
  `;

  const row = rows[0];
  return Boolean(row?.blockedUntil && row.blockedUntil > now) || (row?.attempts ?? 0) > MAX_ATTEMPTS;
}

export async function checkLoginRateLimit(email: string, ip?: string): Promise<boolean> {
  const keys = [keyHash("email", email)];
  if (ip) keys.push(keyHash("ip", ip));

  const blocked = await Promise.all(keys.map(consume));
  return blocked.some(Boolean);
}

export async function clearLoginRateLimit(email: string, ip?: string): Promise<void> {
  const keys = [keyHash("email", email)];
  if (ip) keys.push(keyHash("ip", ip));
  await prisma.loginRateLimit.deleteMany({ where: { key: { in: keys } } });
}
