import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
// The browser is only told to upgrade requests to HTTPS when the app is actually served over HTTPS;
// on a plain-HTTP local demo the directive would make the browser request every script and style
// sheet over HTTPS and the page would never load.
const servedOverHttps = (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js dev tooling (React Refresh, debug stacks) needs eval; production builds never do.
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  ...(servedOverHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    const headers = [...securityHeaders];
    if (isProduction) {
      headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    }
    return [{ source: "/(.*)", headers }];
  },
};

export default nextConfig;
