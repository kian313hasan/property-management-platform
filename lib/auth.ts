import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { env } from "@/lib/config/env";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { recordAuditEvent } from "@/lib/audit/service";
import authConfig from "@/lib/auth.config";
import { checkLoginRateLimit, clearLoginRateLimit } from "@/lib/security/login-rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const requestId = randomUUID();
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;

        if (!email || !password) {
          await recordAuditEvent({ action: "LOGIN_FAILED", actorUserId: null, organizationId: null, resourceType: "AUTH", resourceId: null, requestId, metadata: { reason: "missing_credentials" } });
          return null;
        }
        if (await checkLoginRateLimit(email, ip)) {
          await recordAuditEvent({
            action: "LOGIN_FAILED",
            actorUserId: null,
            organizationId: null,
            resourceType: "AUTH",
            resourceId: null,
            requestId,
            metadata: { reason: "rate_limited" },
          });
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) {
          await recordAuditEvent({ action: "LOGIN_FAILED", actorUserId: null, organizationId: null, resourceType: "AUTH", resourceId: null, requestId, metadata: { reason: "invalid_credentials" } });
          return null;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          await recordAuditEvent({ action: "LOGIN_FAILED", actorUserId: user.id, organizationId: null, resourceType: "AUTH", resourceId: user.id, requestId, metadata: { reason: "invalid_credentials" } });
          return null;
        }
        await clearLoginRateLimit(email, ip);
        await recordAuditEvent({ action: "LOGIN", actorUserId: user.id, organizationId: null, resourceType: "AUTH", resourceId: user.id, requestId });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  secret: env.AUTH_SECRET,
  events: {
    async signOut({ token }) {
      const requestId = randomUUID();
      const actorUserId = typeof token?.id === "string" ? token.id : null;
      await recordAuditEvent({
        action: "LOGOUT",
        actorUserId,
        organizationId: null,
        resourceType: "AUTH",
        resourceId: actorUserId,
        requestId,
      });
    },
  },
});
