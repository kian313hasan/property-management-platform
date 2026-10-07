"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireOrganizationContext } from "@/lib/authorization/organization";

const roles=["SUPER_ADMIN","PROPERTY_MANAGER","ACCOUNTANT","MAINTENANCE_MANAGER","STAFF","TENANT"] as const;
const schema=z.object({role:z.enum(roles)});

export async function createUser(formData:FormData){
  const context=await requireOrganizationContext();
  if(context.role!=="SUPER_ADMIN")return{error:"ليس لديك صلاحية إدارة المستخدمين."};
  const name=String(formData.get("name")??"").trim();
  const email=String(formData.get("email")??"").trim().toLowerCase();
  const password=String(formData.get("password")??"");
  const role=String(formData.get("role")??"STAFF");
  if(name.length<2||!z.string().email().safeParse(email).success||password.length<8||!roles.includes(role as typeof roles[number]))return{error:"تحقق من بيانات المستخدم."};
  if(await prisma.user.findUnique({where:{email},select:{id:true}}))return{error:"هذا البريد الإلكتروني مستخدم بالفعل."};
  const hashed=await bcrypt.hash(password,12);
  await prisma.$transaction(async(tx)=>{
    const user=await tx.user.create({data:{name,email,password:hashed,role:role as typeof roles[number]}});
    await tx.organizationMember.create({data:{organizationId:context.organizationId,userId:user.id,role:role as typeof roles[number]}});
  });
  revalidatePath("/admin/users");
  return{success:true};
}

export async function updateUserRole(formData:FormData){
  const context=await requireOrganizationContext();
  if(context.role!=="SUPER_ADMIN")return{error:"ليس لديك صلاحية إدارة المستخدمين."};
  const userId=String(formData.get("userId")??"");
  const parsed=schema.safeParse({role:formData.get("role")});
  if(!userId||!parsed.success)return{error:"بيانات الدور غير صالحة."};
  if(userId===context.userId&&parsed.data.role!=="SUPER_ADMIN")return{error:"لا يمكنك تخفيض صلاحيتك من حسابك الحالي."};
  await prisma.organizationMember.updateMany({where:{organizationId:context.organizationId,userId},data:{role:parsed.data.role}});
  await prisma.user.update({where:{id:userId},data:{role:parsed.data.role}});
  revalidatePath("/admin/users"); revalidatePath("/dashboard");
  return{success:true};
}
