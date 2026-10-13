"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auditResourceChange } from "@/lib/audit/resource";
import { requireOrganizationContext } from "@/lib/authorization/organization";
import { hasPermission } from "@/lib/authorization/permissions";
import { validationErrorKey, type ActionState } from "./types";

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

const tenantSchema = z.object({
  name: z.string().trim().min(2, "actionErrors.nameRequired"),
  email: z.preprocess(emptyToUndefined, z.string().trim().toLowerCase().max(254).email("actionErrors.emailInvalid").optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  nationalId: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
});

export async function createTenant(formData: FormData): Promise<ActionState> {
  const context = await requireOrganizationContext();
  if (!hasPermission(context.role, "properties:manage")) return { error: "actionErrors.noPermission" };

  const parsed = tenantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    nationalId: formData.get("nationalId"),
    address: formData.get("address"),
  });
  if (!parsed.success) return { error: validationErrorKey(parsed.error.issues[0]?.message) };

  const created = await prisma.tenant.create({ data: { ...parsed.data, organizationId: context.organizationId } });
  await auditResourceChange(context, "RESOURCE_CREATED", "Tenant", created.id);

  revalidatePath("/tenants");
  revalidatePath("/dashboard");
  redirect("/tenants");
}
