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

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const expenseSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  category: z.string().trim().min(2, "actionErrors.categoryRequired").max(80),
  amount: moneyField("actionErrors.moneyInvalid"),
  date: z.iso.date({ error: "actionErrors.dateInvalid" }),
  vendor: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
});

export async function createExpense(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "finance:manage")) return { error: "actionErrors.noPermission" };

  const parsed = expenseSchema.safeParse({
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    vendor: formData.get("vendor"),
    notes: formData.get("notes"),
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

  const created = await prisma.expense.create({
    data: {
      organizationId: context.organizationId,
      propertyId: property.id,
      unitId: data.unitId ?? null,
      category: data.category,
      amount: data.amount,
      date: new Date(data.date),
      vendor: data.vendor ?? null,
      notes: data.notes ?? null,
    },
  });
  await auditResourceChange(context, "RESOURCE_CREATED", "Expense", created.id);

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  redirect("/expenses");
}
