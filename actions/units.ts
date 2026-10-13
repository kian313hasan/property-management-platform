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

const optionalNumber = (schema: z.ZodNumber) => z.preprocess((value) => (value === "" || value === null ? undefined : value), schema.optional());

const unitSchema = z.object({
  unitNumber: z.string().trim().min(1, "actionErrors.unitNumberRequired").max(32),
  floor: optionalNumber(z.coerce.number().int()),
  bedrooms: optionalNumber(z.coerce.number().int().min(0)),
  bathrooms: optionalNumber(z.coerce.number().min(0)),
  area: optionalNumber(z.coerce.number().min(0)),
  rentAmount: moneyField("actionErrors.moneyInvalid"),
});

export async function createUnit(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "properties:manage")) return { error: "actionErrors.noPermission" };

  const propertyId = String(formData.get("propertyId") ?? "");
  const property = await prisma.property.findFirst({ where: { id: propertyId, ...propertyScope(context) }, select: { id: true } });
  if (!property) return { error: "actionErrors.propertyNotAccessible" };

  const parsed = unitSchema.safeParse({
    unitNumber: formData.get("unitNumber"),
    floor: formData.get("floor"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    area: formData.get("area"),
    rentAmount: formData.get("rentAmount"),
  });
  if (!parsed.success) return { error: validationErrorKey(parsed.error.issues[0]?.message) };

  const existing = await prisma.unit.findFirst({
    where: { propertyId: property.id, unitNumber: parsed.data.unitNumber },
    select: { id: true },
  });
  if (existing) return { error: "actionErrors.unitNumberTaken" };

  const created = await prisma.unit.create({
    data: { ...parsed.data, propertyId: property.id, organizationId: context.organizationId },
  });
  await auditResourceChange(context, "RESOURCE_CREATED", "Unit", created.id);

  revalidatePath("/properties");
  revalidatePath(`/properties/${property.id}`);
  redirect(`/properties/${property.id}`);
}
