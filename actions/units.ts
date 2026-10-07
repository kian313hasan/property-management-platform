"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const schema=z.object({propertyId:z.string().min(1),unitNumber:z.string().trim().min(1,"رقم الوحدة مطلوب"),floor:z.coerce.number().int().optional(),bedrooms:z.coerce.number().int().min(0).optional(),bathrooms:z.coerce.number().min(0).optional(),area:z.coerce.number().min(0).optional(),rentAmount:z.coerce.number().positive("الإيجار يجب أن يكون أكبر من صفر")});
export async function createUnit(formData:FormData){const s=await auth();const propertyId=String(formData.get("propertyId")??"");if(!s?.user?.id||!["SUPER_ADMIN","PROPERTY_MANAGER"].includes(s.user.role))return{error:"ليس لديك صلاحية."};const p=await prisma.property.findFirst({where:s.user.role==="PROPERTY_MANAGER"?{id:propertyId,managerId:s.user.id}:{id:propertyId},select:{id:true}});if(!p)return{error:"ليس لديك صلاحية إدارة هذا العقار."};const v=schema.safeParse({propertyId,unitNumber:formData.get("unitNumber"),floor:formData.get("floor")||undefined,bedrooms:formData.get("bedrooms")||undefined,bathrooms:formData.get("bathrooms")||undefined,area:formData.get("area")||undefined,rentAmount:formData.get("rentAmount")});if(!v.success)return{error:v.error.issues[0]?.message??"تحقق من البيانات."};try{await prisma.unit.create({data:v.data})}catch{return{error:"رقم الوحدة مستخدم مسبقاً في هذا العقار."}}revalidatePath("/properties");revalidatePath("/properties/"+propertyId);redirect("/properties/"+propertyId)}
