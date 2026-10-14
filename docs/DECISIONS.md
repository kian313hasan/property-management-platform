# Architecture Decision Log

## ADR-001: PostgreSQL + Prisma
Context: the product needs relational integrity, reporting, transactions, and multi-tenancy.
Decision: PostgreSQL with Prisma 7.
Alternatives: Drizzle ORM; SQLite.
Reason: PostgreSQL is the production relational boundary; Prisma provides a typed data model and migration workflow. SQLite is historical development state, not the production target.
Consequences: PostgreSQL is required for the foundation; migration work is required before existing business tables are production-ready.

## ADR-002: Organization as tenant boundary
Context: the SaaS must prevent cross-tenant data access.
Decision: Organization is the tenant boundary; membership is derived server-side from the authenticated user.
Alternatives: client-supplied tenant IDs; database-per-tenant.
Reason: explicit organization ownership is simple, scalable, and supports shared infrastructure.
Consequences: every future resource needs an organization ownership path and every query must enforce it.

## ADR-003: Auth.js for authentication
Context: the application already uses Auth.js and needs extensibility.
Decision: keep Auth.js as the authentication boundary.
Alternatives: custom session implementation; external identity provider only.
Reason: existing integration plus support for credentials and future OAuth/email/passkeys.
Consequences: password hardening, rate limiting, and recovery remain application responsibilities for credentials.

## ADR-004: Server-side authorization
Context: UI-only permission checks are bypassable.
Decision: authorization is enforced server-side using role/permission + organization + resource ownership policies.
Alternatives: UI-only RBAC.
Reason: server checks are the actual security boundary.
Consequences: every mutation and protected read must pass a policy check.

## ADR-005: Lightweight i18n foundation
Context: the product needs Arabic, English, and Persian without unnecessary dependency weight.
Decision: start with a small typed locale configuration and translation resource boundary; add a full i18n library only when routing/message-format requirements justify it.
Alternatives: next-intl immediately.
Reason: avoid premature dependency complexity during foundation.
Consequences: locale routing and message formatting must remain centralized and tested.

## ADR-006: Shared-schema organization ownership
Context: the initial business tables were not tenant-scoped, which would permit cross-organization reads/writes once multiple organizations exist.
Decision: add a mandatory organizationId to Property, Unit, Tenant, Lease, Payment, Expense, and MaintenanceRequest, with PostgreSQL foreign keys to Organization and organization-scoped server-side queries.
Migration strategy: existing single-tenant records are assigned to a deterministic default organization during the migration, and existing users receive membership in that organization.
Reason: preserves existing data while establishing an explicit tenant boundary without introducing database-per-tenant operational complexity.
Consequences: all future data access must derive organization context from authenticated membership; client-supplied organization IDs are not trusted. Cross-tenant integration tests remain a required gate.

## ADR-007: Permission matrix in code, Permission tables not authoritative
Context: RBAC needs one reviewable source of truth; the schema also has Permission/RolePermission tables.
Decision: `lib/authorization/permissions.ts` is the source of truth. A unit test keeps the Prisma `PermissionKey` and `Role` enums in sync with it. The tables are not read at runtime.
Alternatives: database-driven, per-organization custom roles.
Reason: a typed constant is simple, testable and cannot be altered by data changes; custom roles are not a current requirement.
Consequences: per-organization custom roles would require a new ADR and migrating the check to read the tables.

## ADR-008: Login and password-reset rate limiting in PostgreSQL
Context: credentials authentication needs brute-force protection without adding Redis.
Decision: a `LoginRateLimit` table keyed by normalized email and, when available, client IP.
Alternatives: in-memory limiter (breaks with several instances); Redis; edge/WAF only.
Reason: works across instances with the existing database.
Consequences: extra DB writes per attempt; `x-forwarded-for` is only trustworthy behind a proxy that overwrites it. Rate limiting for uploads and expensive endpoints is still to be built.

## ADR-009: Auth.js with JWT sessions
Context: the Credentials provider cannot use database sessions in Auth.js.
Decision: JWT session strategy; authorization re-reads the membership role from the database on every request (`requireOrganizationContext`).
Alternatives: database sessions; custom session store.
Reason: avoids trusting a role cached in the token. Consequence: `Session` table is unused, and JWTs cannot be revoked server-side before expiry (accepted risk, see docs/STATUS.md).

## ADR-010: Locale formatting: Western digits and Gregorian calendar everywhere
Context: Arabic and Persian users differ in expected digits and calendar.
Decision (confirmed by the product owner, 2026-10-13): all locales use Western digits (0-9) and the Gregorian calendar, forced through the `-u-ca-gregory-nu-latn` Intl extension. Locale comes from cookie, then Accept-Language, then `en`. No locale in the URL.
Alternatives: Persian digits and Jalali calendar for fa; Arabic-Indic digits for ar; next-intl with locale routing.
Reason: consistent figures across locales for the university delivery; minimal dependencies (ADR-005).
Consequences: a Jalali/Persian-digit option would need a new ADR; locale-prefixed URLs likewise.

## ADR-011: Custom UI primitives instead of the shadcn/ui CLI
Context: the brief names shadcn/ui and React Hook Form.
Decision: `components/ui/*` are hand-written primitives (cva + tailwind-merge) in the shadcn style. Forms use `useActionState`. React Hook Form was removed from dependencies on 2026-10-13 because it was unused (confirmed by the product owner); it can be re-added with a reason if complex client-side forms appear.
Reason: no generated code was pulled in during the foundation phase.
Consequences: hand-written primitives are maintained in-repo.

## ADR-012: Fully local operation (no external services)
Context: the project is delivered for university review and must run 100% locally.
Decision (confirmed 2026-10-13): no external email or storage provider is integrated. Password-reset links are printed to the server console outside production (`lib/mail/local-mailer.ts`); in production nothing is printed and a warning records the missing provider. If file storage is needed it will use a private local directory behind the same adapter boundary, with allowlists, size limits and generated keys (not yet implemented).
Alternatives: SMTP/SaaS email; S3-compatible storage.
Reason: no accounts, keys or network are required to demo the project.
Consequences: password reset is a development-only flow; a real provider needs a new ADR. `STORAGE_*`, `EMAIL_*` and `SENTRY_DSN` env variables stay optional and unused.

## ADR-013: Append-only audit log enforced by a database trigger
Context: audit entries must not be editable or deletable by application users, including through a bug or a compromised application connection.
Decision: migration `20261014090000_protect_audit_log` adds a trigger on "AuditLog" that rejects DELETE, TRUNCATE and every UPDATE except the referential action of the existing `ON DELETE SET NULL` keys (a non-null organization/actor reference becoming NULL with all other columns unchanged).
Alternatives: revoke UPDATE/DELETE from the application role (needs separate DB roles, not available in the local setup); application-level convention only (previous state); a separate immutable store.
Reason: works with the single local database role and still lets organizations and users be deleted without losing their audit history.
Consequences: audit rows can be orphaned (reference NULL) but never changed otherwise; a superuser or table owner can still drop the trigger, so production should also run the app with a role that lacks ALTER/TRIGGER on the table. Retention/archival of old audit rows now requires a deliberate migration.

## ADR-014: E2E tests run against the production build in CI
Context: under `next dev` in CI the HMR WebSocket handshake fails and pages did not hydrate reliably, so forms could not be driven.
Decision: the CI `e2e` job builds the app and runs the standalone server; locally the default remains `npm run dev` (override with `E2E_SERVER_COMMAND`). The suite seeds its own organization and users (`tests/e2e/global-setup.ts`).
Alternatives: keep the dev server with longer waits; use `next start`.
Reason: deterministic, faster, and the same artifact shape as the Docker image.
Consequences: dev-server behaviour is not covered by CI. Running a production build locally over HTTP needs `AUTH_TRUST_HOST=true` (Auth.js rejects unknown hosts otherwise).

## ADR-015: Cookie `Secure` flag and CSP `upgrade-insecure-requests` follow the public URL
Context: both used NODE_ENV, which breaks a production build served over plain HTTP for a local demo (browsers requested assets over HTTPS; Safari refuses Secure cookies on HTTP).
Decision: both are enabled only when `NEXTAUTH_URL` starts with `https://` (`lib/security/cookies.ts`, `next.config.ts`). The CSP allows `unsafe-eval` only outside production (dev tooling).
Consequences: any real deployment must set `NEXTAUTH_URL` to its https URL, otherwise these protections are off.
