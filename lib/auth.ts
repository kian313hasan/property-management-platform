import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { env } from "@/lib/config/env";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { recordAuditEvent } from "@/lib/audit/service";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const requestId = randomUUID();
        if (!credentials?.email || !credentials?.password) {
          await recordAuditEvent({ action: "LOGIN_FAILED", actorUserId: null, organizationId: null, resourceType: "AUTH", resourceId: null, requestId, metadata: { reason: "missing_credentials" } });
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        if (!user?.password) {
          await recordAuditEvent({ action: "LOGIN_FAILED", actorUserId: null, organizationId: null, resourceType: "AUTH", resourceId: null, requestId, metadata: { reason: "invalid_credentials" } });
          return null;
        }
        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isPasswordValid) {
          await recordAuditEvent({ action: "LOGIN_FAILED", actorUserId: user.id, organizationId: null, resourceType: "AUTH", resourceId: user.id, requestId, metadata: { reason: "invalid_credentials" } });
          return null;
        }
        await recordAuditEvent({ action: "LOGIN", actorUserId: user.id, organizationId: null, resourceType: "AUTH", resourceId: user.id, requestId });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  secret: env.AUTH_SECRET,
});
