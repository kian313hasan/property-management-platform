"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auditResourceChange } from "@/lib/audit/resource";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { hasPermission } from "@/lib/authorization/permissions";
import { validationErrorKey, type ActionState } from "./types";

const propertySchema = z.object({
  name: z.string().trim().min(2, "actionErrors.nameRequired"),
  address: z.string().trim().min(3, "actionErrors.addressRequired"),
  city: z.string().trim().min(2, "actionErrors.cityRequired"),
  country: z.string().trim().min(2, "actionErrors.countryRequired"),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED", "OTHER"]),
});

export async function createProperty(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "properties:manage")) return { error: "actionErrors.noPermission" };

  const parsed = propertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    type: formData.get("type"),
  });
  if (!parsed.success) return { error: validationErrorKey(parsed.error.issues[0]?.message) };

  const created = await prisma.property.create({
    data: {
      ...parsed.data,
      organizationId: context.organizationId,
      managerId: context.role === "PROPERTY_MANAGER" ? context.userId : null,
    },
  });
  await auditResourceChange(context, "RESOURCE_CREATED", "Property", created.id);

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect("/properties");
}
