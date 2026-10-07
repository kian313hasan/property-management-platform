import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors/app-error";
import { cookies } from "next/headers";

export const ACTIVE_ORGANIZATION_COOKIE = "active_organization_id";

export async function requireOrganizationContext() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication is required.");
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id },
    select: {
      organizationId: true,
      role: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    throw new AppError("FORBIDDEN", "The user is not a member of an organization.");
  }

  const cookieStore = await cookies();
  const requestedOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const membership =
    memberships.find((item) => item.organizationId === requestedOrganizationId) ??
    memberships[0];

  if (!membership) {
    throw new AppError("INTERNAL_ERROR", "Organization context could not be resolved.");
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    organization: membership.organization,
    memberships: memberships.map((item) => ({
      organizationId: item.organizationId,
      role: item.role,
      organization: item.organization,
    })),
  };
}
