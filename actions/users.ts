"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const roles=["SUPER_ADMIN","PROPERTY_MANAGER","ACCOUNTANT","MAINTENANCE_MANAGER","STAFF","TENANT"] as const;
const schema=z.object({role:z.enum(roles)});
export async function createUser(formData:FormData){
  const session=await auth();
  if(!session?.user?.id)return{error:"يجب تسجيل الدخول أولاً."};
  if(session.user.role!=="SUPER_ADMIN")return{error:"ليس لديك صلاحية إدارة المستخدمين."};
  const name=String(formData.get("name")??"").trim();
  const email=String(formData.get("email")??"").trim().toLowerCase();
  const password=String(formData.get("password")??"");
  const role=String(formData.get("role")??"STAFF");
  if(name.length<2||!z.string().email().safeParse(email).success||password.length<8||!roles.includes(role as typeof roles[number]))return{error:"تحقق من بيانات المستخدم."};
  if(await prisma.user.findUnique({where:{email},select:{id:true}}))return{error:"هذا البريد الإلكتروني مستخدم بالفعل."};
  const hashed=await bcrypt.hash(password,12);
  await prisma.user.create({data:{name,email,password:hashed,role:role as typeof roles[number]}});
  revalidatePath("/admin/users");
  return{success:true};
}

export async function updateUserRole(formData:FormData){const session=await auth();if(!session?.user?.id)return{error:"يجب تسجيل الدخول أولاً."};if(session.user.role!=="SUPER_ADMIN")return{error:"ليس لديك صلاحية إدارة المستخدمين."};const userId=String(formData.get("userId")??"");const parsed=schema.safeParse({role:formData.get("role")});if(!userId||!parsed.success)return{error:"بيانات الدور غير صالحة."};if(userId===session.user.id&&parsed.data.role!=="SUPER_ADMIN")return{error:"لا يمكنك تخفيض صلاحيتك من حسابك الحالي."};await prisma.user.update({where:{id:userId},data:{role:parsed.data.role}});revalidatePath("/admin/users");revalidatePath("/dashboard");return{success:true};}
