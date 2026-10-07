"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const roles=["SUPER_ADMIN","PROPERTY_MANAGER","ACCOUNTANT","MAINTENANCE_MANAGER","STAFF","TENANT"] as const;
const schema=z.object({role:z.enum(roles)});
export async function createUser(_formData:FormData){return{error:"إنشاء المستخدمين من لوحة الإدارة سيُفعّل بعد ربطه بمسار التسجيل الآمن."};}

export async function updateUserRole(formData:FormData){const session=await auth();if(!session?.user?.id)return{error:"يجب تسجيل الدخول أولاً."};if(session.user.role!=="SUPER_ADMIN")return{error:"ليس لديك صلاحية إدارة المستخدمين."};const userId=String(formData.get("userId")??"");const parsed=schema.safeParse({role:formData.get("role")});if(!userId||!parsed.success)return{error:"بيانات الدور غير صالحة."};if(userId===session.user.id&&parsed.data.role!=="SUPER_ADMIN")return{error:"لا يمكنك تخفيض صلاحيتك من حسابك الحالي."};await prisma.user.update({where:{id:userId},data:{role:parsed.data.role}});revalidatePath("/admin/users");revalidatePath("/dashboard");return{success:true};}
