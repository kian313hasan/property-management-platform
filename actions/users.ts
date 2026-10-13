"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { auditResourceChange } from "@/lib/audit/resource";
import { recordAuditEvent } from "@/lib/audit/service";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { ROLES, hasPermission } from "@/lib/authorization/permissions";
import { emailSchema, passwordSchema } from "@/lib/validation/common";
import type { ActionState } from "./types";

const roleSchema = z.enum(ROLES);
const createUserSchema = z.object({
  name: z.string().trim().min(2, "actionErrors.nameRequired").max(120),
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
});

export async function createUser(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "users:manage")) return { error: "actionErrors.noPermission" };

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ?? "STAFF",
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") return { error: "actionErrors.emailInvalid" };
    if (field === "password") return { error: "actionErrors.passwordInvalid" };
    if (field === "role") return { error: "actionErrors.invalidRole" };
    return { error: "actionErrors.nameRequired" };
  }
  const { name, email, password, role } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return { error: "actionErrors.userExists" };

  const hashed = await bcrypt.hash(password, 12);
  const createdUserId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, password: hashed, role } });
    await tx.organizationMember.create({ data: { organizationId: context.organizationId, userId: user.id, role } });
    return user.id;
  });
  await auditResourceChange(context, "RESOURCE_CREATED", "User", createdUserId, { role });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRole(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "users:manage")) return { error: "actionErrors.noPermission" };

  const userId = String(formData.get("userId") ?? "");
  const parsed = roleSchema.safeParse(formData.get("role"));
  if (!userId || !parsed.success) return { error: "actionErrors.invalidRole" };
  const role = parsed.data;
  if (userId === context.userId && role !== "SUPER_ADMIN") return { error: "actionErrors.cannotDemoteSelf" };

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: context.organizationId, userId } },
    select: { id: true, role: true },
  });
  if (!membership) return { error: "actionErrors.notMember" };

  await prisma.organizationMember.update({ where: { id: membership.id }, data: { role } });
  // Transitional compatibility: the JWT currently carries User.role.
  // OrganizationMember.role is the authorization source of truth.
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await recordAuditEvent({
    action: "ROLE_CHANGED",
    actorUserId: context.userId,
    organizationId: context.organizationId,
    resourceType: "OrganizationMember",
    resourceId: membership.id,
    requestId: randomUUID(),
    metadata: { previousRole: membership.role, newRole: role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  return { success: true };
}
