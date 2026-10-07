import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit/service";

const RESET_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (!user) return;

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const rawToken = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      id: randomUUID(),
      tokenHash: hashToken(rawToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  await recordAuditEvent({
    action: "PASSWORD_RESET_REQUESTED",
    actorUserId: user.id,
    organizationId: null,
    resourceType: "AUTH",
    resourceId: user.id,
    requestId: randomUUID(),
  });

  return rawToken;
}

export async function consumePasswordReset(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true },
  });

  if (!record) return false;

  const password = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: {
        id: record.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (claimed.count !== 1) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: { password },
    });

    return true;
  });

  if (updated) {
    await recordAuditEvent({
      action: "PASSWORD_RESET_COMPLETED",
      actorUserId: record.userId,
      organizationId: null,
      resourceType: "AUTH",
      resourceId: record.userId,
      requestId: randomUUID(),
    });
  }

  return updated;
}
