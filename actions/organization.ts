"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganizationContext, ACTIVE_ORGANIZATION_COOKIE } from "@/lib/authorization/organization";
import type { ActionState } from "./types";

const schema = z.object({ organizationId: z.string().min(1) });

export async function switchOrganization(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  const parsed = schema.safeParse({ organizationId: formData.get("organizationId") });
  if (!parsed.success) return { error: "actionErrors.invalidOrganization" };

  // The requested organization is only honoured if the signed-in user is a member of it.
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: parsed.data.organizationId, userId: context.userId } },
    select: { organizationId: true },
  });
  if (!membership) return { error: "actionErrors.noOrganizationAccess" };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, membership.organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return { success: true };
}
