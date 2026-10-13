"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auditResourceChange } from "@/lib/audit/resource";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { hasPermission } from "@/lib/authorization/permissions";
import { propertyScope } from "@/lib/authorization/scope";
import { moneyField } from "@/lib/validation/common";
import { validationErrorKey, type ActionState } from "./types";

// A missing field (null) and an empty text box ("") both mean "not provided".
const emptyToUndefined = (value: unknown) => (value === null || (typeof value === "string" && value.trim() === "") ? undefined : value);

const maintenanceSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  tenantId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  assignedToId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  title: z.string().trim().min(3, "actionErrors.titleRequired").max(160),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  cost: z.preprocess(emptyToUndefined, moneyField("actionErrors.moneyInvalidOrZero", { allowZero: true }).optional()),
});

export async function createMaintenance(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "maintenance:manage")) return { error: "actionErrors.noPermission" };

  const parsed = maintenanceSchema.safeParse({
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId"),
    tenantId: formData.get("tenantId"),
    // Staff can only assign requests to themselves; the client value is ignored for them.
    assignedToId: context.role === "STAFF" ? context.userId : formData.get("assignedToId"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    cost: formData.get("cost"),
  });
  if (!parsed.success) return { error: validationErrorKey(parsed.error.issues[0]?.message) };
  const data = parsed.data;

  const property = await prisma.property.findFirst({ where: { id: data.propertyId, ...propertyScope(context) }, select: { id: true } });
  if (!property) return { error: "actionErrors.propertyNotAccessible" };

  if (data.unitId) {
    const unit = await prisma.unit.findFirst({
      where: { id: data.unitId, propertyId: property.id, organizationId: context.organizationId },
      select: { id: true },
    });
    if (!unit) return { error: "actionErrors.unitNotInProperty" };
  }

  if (data.tenantId) {
    // Managers may only reference tenants without leases yet or tenants leasing in this property.
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: data.tenantId,
        organizationId: context.organizationId,
        ...(context.role === "PROPERTY_MANAGER"
          ? {
              OR: [
                { leases: { none: { organizationId: context.organizationId } } },
                { leases: { some: { organizationId: context.organizationId, unit: { propertyId: property.id } } } },
              ],
            }
          : {}),
      },
      select: { id: true },
    });
    if (!tenant) return { error: "actionErrors.tenantOutOfScope" };
  }

  if (data.assignedToId) {
    const assignee = await prisma.organizationMember.findFirst({
      where: { organizationId: context.organizationId, userId: data.assignedToId, role: { in: ["STAFF", "MAINTENANCE_MANAGER"] } },
      select: { userId: true },
    });
    if (!assignee) return { error: "actionErrors.assigneeInvalid" };
  }

  const created = await prisma.maintenanceRequest.create({
    data: {
      organizationId: context.organizationId,
      propertyId: property.id,
      unitId: data.unitId ?? null,
      tenantId: data.tenantId ?? null,
      assignedToId: data.assignedToId ?? null,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority,
      status: data.status,
      cost: data.cost ?? null,
      resolvedAt: data.status === "RESOLVED" || data.status === "CLOSED" ? new Date() : null,
    },
  });
  await auditResourceChange(context, "RESOURCE_CREATED", "MaintenanceRequest", created.id);

  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  redirect("/maintenance");
}
