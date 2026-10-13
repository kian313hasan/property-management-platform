"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auditResourceChange } from "@/lib/audit/resource";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { hasPermission } from "@/lib/authorization/permissions";
import { leaseScope } from "@/lib/authorization/scope";
import { moneyField } from "@/lib/validation/common";
import { validationErrorKey, type ActionState } from "./types";

const dateField = z.iso.date({ error: "actionErrors.dateInvalid" });
const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const paymentSchema = z.object({
  leaseId: z.string().min(1),
  amount: moneyField("actionErrors.moneyInvalid"),
  dueDate: dateField,
  paidDate: z.preprocess(emptyToUndefined, dateField.optional()),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]),
  method: z.preprocess(emptyToUndefined, z.string().trim().max(80).optional()),
  reference: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
});

export async function createPayment(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "finance:manage")) return { error: "actionErrors.noPermission" };

  const parsed = paymentSchema.safeParse({
    leaseId: formData.get("leaseId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    paidDate: formData.get("paidDate"),
    status: formData.get("status"),
    method: formData.get("method"),
    reference: formData.get("reference"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: validationErrorKey(parsed.error.issues[0]?.message) };
  const data = parsed.data;

  if (data.status === "PAID" && !data.paidDate) return { error: "actionErrors.paidDateRequired" };

  // A lease outside the organization, or (for managers) outside their properties, is "not found".
  const lease = await prisma.lease.findFirst({ where: { id: data.leaseId, ...leaseScope(context) }, select: { id: true } });
  if (!lease) return { error: "actionErrors.leaseNotFound" };

  const created = await prisma.payment.create({
    data: {
      organizationId: context.organizationId,
      leaseId: lease.id,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      paidDate: data.paidDate ? new Date(data.paidDate) : null,
      status: data.status,
      method: data.method ?? null,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
    },
  });
  await auditResourceChange(context, "RESOURCE_CREATED", "Payment", created.id);

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  redirect("/payments");
}
