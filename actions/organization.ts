"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrganizationContext, ACTIVE_ORGANIZATION_COOKIE } from "@/lib/authorization/organization";

const schema = z.object({ organizationId: z.string().min(1) });

export async function switchOrganization(formData: FormData) {
  const context = await requireOrganizationContext();
  const parsed = schema.safeParse({ organizationId: formData.get("organizationId") });

  if (!parsed.success) return { error: "المؤسسة غير صالحة." };

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: parsed.data.organizationId,
        userId: context.userId,
      },
    },
    select: { organizationId: true },
  });

  if (!membership) return { error: "لا تملك صلاحية الوصول إلى هذه المؤسسة." };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, membership.organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return { success: true };
}
