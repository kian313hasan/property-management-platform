/**
 * Whether cookies set by the application get the `Secure` attribute.
 *
 * It follows the configured public URL, not NODE_ENV: a production build served over plain HTTP for a
 * local demo (http://localhost:3000) would otherwise set `Secure` cookies that Safari refuses to store,
 * silently breaking the language switcher and the active-organization selector. Anything served over
 * HTTPS (NEXTAUTH_URL starts with https://) always gets `Secure`.
 */
export function shouldUseSecureCookies(url: string | undefined = process.env.NEXTAUTH_URL): boolean {
  return (url ?? "").startsWith("https://");
}
