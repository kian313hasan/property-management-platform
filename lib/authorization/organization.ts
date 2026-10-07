import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors/app-error";

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
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    throw new AppError("FORBIDDEN", "The user is not a member of an organization.");
  }

  if (memberships.length > 1) {
    throw new AppError(
      "CONFLICT",
      "Multiple organization memberships require an explicit active organization."
    );
  }

  const membership = memberships[0];

  if (!membership) {
    throw new AppError("INTERNAL_ERROR", "Organization context could not be resolved.");
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    organization: membership.organization,
  };
}
