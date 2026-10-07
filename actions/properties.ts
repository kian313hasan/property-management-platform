"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrganizationContext } from "@/lib/authorization/organization";

const propertySchema = z.object({
  name: z.string().trim().min(2, "اسم العقار مطلوب"),
  address: z.string().trim().min(3, "العنوان مطلوب"),
  city: z.string().trim().min(2, "المدينة مطلوبة"),
  country: z.string().trim().min(2, "الدولة مطلوبة"),
  type: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED", "OTHER"]),
});

const canManageProperties = new Set(["SUPER_ADMIN", "PROPERTY_MANAGER"]);

export async function createProperty(formData: FormData) {
  const context = await requireOrganizationContext();
  if (!canManageProperties.has(context.role)) return { error: "ليس لديك صلاحية إضافة عقار." };

  const parsed = propertySchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    country: formData.get("country"),
    type: formData.get("type"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "تحقق من البيانات." };

  await prisma.property.create({
    data: {
      ...parsed.data,
      organizationId: context.organizationId,
      managerId: context.role === "PROPERTY_MANAGER" ? context.userId : null,
    },
  });

  revalidatePath("/properties");
  revalidatePath("/dashboard");
  redirect("/properties");
}
