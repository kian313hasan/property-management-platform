import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

// Every authenticated area. This is a first, coarse gate only: each page and server action still
// performs its own authentication, organization and permission checks (deny by default).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/properties",
  "/tenants",
  "/leases",
  "/payments",
  "/expenses",
  "/maintenance",
] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname === "/login";
  const isOnRegisterPage = req.nextUrl.pathname === "/register";

  if (isProtectedPath(req.nextUrl.pathname) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && (isOnLoginPage || isOnRegisterPage)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
