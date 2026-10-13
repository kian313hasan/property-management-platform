"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auditResourceChange } from "@/lib/audit/resource";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { hasPermission } from "@/lib/authorization/permissions";
import { tenantScope, unitScope } from "@/lib/authorization/scope";
import { moneyField } from "@/lib/validation/common";
import { validationErrorKey, type ActionState } from "./types";

const dateField = z.iso.date({ error: "actionErrors.dateInvalid" });

const leaseSchema = z.object({
  unitId: z.string().min(1),
  tenantId: z.string().min(1),
  startDate: dateField,
  endDate: dateField,
  rentAmount: moneyField("actionErrors.moneyInvalid"),
  depositAmount: z.preprocess((value) => (value === "" || value === null ? undefined : value), moneyField("actionErrors.moneyInvalidOrZero", { allowZero: true }).optional()),
  paymentDueDay: z.coerce.number().int().min(1).max(28),
  notes: z.string().trim().max(1000).optional(),
});

export async function createLease(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "properties:manage")) return { error: "actionErrors.noPermission" };

  const parsed = leaseSchema.safeParse({
    unitId: formData.get("unitId"),
    tenantId: formData.get("tenantId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rentAmount: formData.get("rentAmount"),
    depositAmount: formData.get("depositAmount"),
    paymentDueDay: formData.get("paymentDueDay"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: validationErrorKey(parsed.error.issues[0]?.message) };
  const data = parsed.data;

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (endDate <= startDate) return { error: "actionErrors.endBeforeStart" };

  const unit = await prisma.unit.findFirst({ where: { id: data.unitId, ...unitScope(context) }, select: { id: true } });
  if (!unit) return { error: "actionErrors.unitNotAccessible" };

  const tenant = await prisma.tenant.findFirst({ where: { id: data.tenantId, ...tenantScope(context) }, select: { id: true } });
  if (!tenant) return { error: "actionErrors.tenantOutOfScope" };

  const active = await prisma.lease.findFirst({
    where: { unitId: unit.id, organizationId: context.organizationId, status: "ACTIVE" },
    select: { id: true },
  });
  if (active) return { error: "actionErrors.activeLeaseExists" };

  const created = await prisma.$transaction(async (tx) => {
    const lease = await tx.lease.create({
      data: {
        organizationId: context.organizationId,
        unitId: unit.id,
        tenantId: tenant.id,
        startDate,
        endDate,
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount ?? null,
        paymentDueDay: data.paymentDueDay,
        status: "ACTIVE",
        notes: data.notes ?? null,
      },
    });
    await tx.unit.updateMany({ where: { id: unit.id, organizationId: context.organizationId }, data: { status: "OCCUPIED" } });
    return lease;
  });
  await auditResourceChange(context, "RESOURCE_CREATED", "Lease", created.id);

  revalidatePath("/leases");
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect("/leases");
}
