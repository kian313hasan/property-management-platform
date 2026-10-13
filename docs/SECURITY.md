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

## Testable checklist
Status values: **Covered** = an automated test exists in the repo; **Partial** = implemented, only partly tested; **Open** = not implemented or not tested. "Covered" means the test was written, not that it has been run in every environment; CI is authoritative.

| # | Control | Evidence | Status |
|---|---------|----------|--------|
| 1 | Env validation fails safely, never echoes values | tests/unit/env.test.ts | Covered |
| 2 | Role/permission matrix, deny by default, enums in sync with Prisma | tests/unit/permissions.test.ts, authorization.test.ts | Covered |
| 3 | Cross-tenant relation rejected by the database | tests/integration/tenant-isolation.integration.test.ts | Covered (needs PostgreSQL) |
| 4 | Login and password-reset rate limit, single-use hashed reset token | tests/integration/... | Covered (needs PostgreSQL) |
| 5 | Input validation (email, password, money, dates, locale) | tests/unit/validation.test.ts | Covered |
| 6 | Errors never leak SQL, paths, stack traces | tests/unit/errors.test.ts | Covered |
| 7 | Logger redacts secrets; error messages hidden in production | tests/unit/logger.test.ts | Covered |
| 8 | Every server action authenticates, derives organization, checks role + ownership | Code review only | Partial: no per-action tests (IDOR tests missing) |
| 9 | Unauthenticated access to protected routes redirects to /login | proxy.ts | Partial: no E2E test |
| 10 | Security headers present (CSP, X-Frame-Options, nosniff, HSTS in prod) | next.config.ts | Partial: no test; CSP allows `unsafe-inline` |
| 11 | CSRF | Next.js server actions compare Origin/Host; no custom route handlers mutate state | Partial: not tested |
| 12 | Audit log append-only | Convention only | Open |
| 13 | Audit events for sensitive resource changes | `auditResourceChange` exists; only auth, role and reset events call the audit service | Open |
| 14 | Secure file upload, storage and malware scanning | Not implemented | Open |
| 15 | SSRF protection | No outbound fetch from user input exists yet; a rule is required before adding one | Open (n/a today) |
| 16 | MFA / passkeys, JWT revocation | Not implemented | Open |
| 17 | Dependency scanning | `npm audit` in CI, CodeQL, dependency-review, Dependabot | Partial: never observed running here |

Nothing in this repository is a claim that the application is secure; the Open and Partial rows are the remaining work.
