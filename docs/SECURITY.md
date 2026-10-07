# Security Baseline

This is a security baseline, not a claim of complete security.

## Controls
- Server-side authentication and authorization.
- Organization boundary derived from server session/membership, with an explicit active-organization selector validated against the authenticated user's memberships.
- Zod validation at trust boundaries.
- Prisma parameterized queries; raw SQL requires review.
- Secure cookies through Auth.js.
- Security headers configured centrally, including a hardened Content Security Policy baseline.
- Production errors map to safe public messages.
- Structured logs exclude passwords, tokens, API keys, and unnecessary sensitive PII.
- File uploads require allowlists, size limits, generated object keys, malware scanning where required, and private storage URLs.
- Authentication login attempts are rate-limited with a persistent PostgreSQL-backed window keyed by normalized email and, when available, client IP.
- Rate limiting remains required for password reset, uploads, and expensive endpoints.
- Audit logs are append-only to application users.
- Dependencies are reviewed and scanned in CI.

## OWASP review checklist
Authentication bypass; broken access control / IDOR; cross-tenant access; injection; XSS; CSRF where cookie-authenticated state changes are exposed; SSRF; path traversal; malicious uploads; sensitive data exposure; security misconfiguration; vulnerable dependencies; rate-limit bypass; business-logic authorization flaws.

## Secrets
Secrets belong in deployment secret storage/environment configuration. Never commit real credentials.

## Incident principle
Deny by default. Fail closed on missing authentication, organization context, or authorization.

## Current foundation decisions
- Public registration is disabled; users are created by an organization SUPER_ADMIN so every account receives an organization membership.
- Authentication success/failure, logout, and organization role changes are written to AuditLog through a best-effort audit service.
- Organization ownership is enforced both in application queries and, for cross-entity relations, with PostgreSQL composite foreign keys using `(resourceId, organizationId)`.
- Optional cross-entity references use restrictive delete behavior where PostgreSQL cannot null only the resource ID without also nulling the mandatory organization ID.
- Login rate limiting is implemented and covered by integration tests.
- Password reset token issuance/consumption is implemented with hashed, single-use, expiring tokens and non-enumerating request behavior. Email delivery is intentionally not bundled because no mail provider is configured.
- MFA/passkeys, file scanning/storage controls, and a nonce-based strict CSP remain explicit security gates before production security sign-off. The current CSP is a hardened baseline, not a claim of a fully strict nonce policy.
