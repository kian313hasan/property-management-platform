type HeaderReader = { get(name: string): string | null };

/**
 * Best-effort client IP used only as a rate-limit key.
 *
 * `x-forwarded-for` / `x-real-ip` are client-controlled unless the app runs behind a trusted proxy
 * that overwrites them. The IP therefore is never an authorization input, and rate limits are also
 * keyed by the normalized account identifier so spoofing the header does not lift the limit.
 */
export function getClientIp(headers: HeaderReader): string | undefined {
  const forwardedFor = headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || undefined;
}
