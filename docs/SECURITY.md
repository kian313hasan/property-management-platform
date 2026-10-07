# Security Baseline

This is a security baseline, not a claim of complete security.

## Controls
- Server-side authentication and authorization.
- Organization boundary derived from server session/membership.
- Zod validation at trust boundaries.
- Prisma parameterized queries; raw SQL requires review.
- Secure cookies through Auth.js.
- Security headers configured centrally.
- Production errors map to safe public messages.
- Structured logs exclude passwords, tokens, API keys, and unnecessary sensitive PII.
- File uploads require allowlists, size limits, generated object keys, malware scanning where required, and private storage URLs.
- Rate limiting is required for authentication, password reset, uploads, and expensive endpoints.
- Audit logs are append-only to application users.
- Dependencies are reviewed and scanned in CI.

## OWASP review checklist
Authentication bypass; broken access control / IDOR; cross-tenant access; injection; XSS; CSRF where cookie-authenticated state changes are exposed; SSRF; path traversal; malicious uploads; sensitive data exposure; security misconfiguration; vulnerable dependencies; rate-limit bypass; business-logic authorization flaws.

## Secrets
Secrets belong in deployment secret storage/environment configuration. Never commit real credentials.

## Incident principle
Deny by default. Fail closed on missing authentication, organization context, or authorization.
