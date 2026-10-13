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

## ADR-010: Locale formatting choices (needs product confirmation)
Context: Arabic and Persian users differ in expected digits and calendar.
Decision: Arabic uses Western digits (`ar-u-nu-latn`); Persian uses `fa-IR` (Persian digits, Jalali calendar); English uses `en-US`. Locale comes from cookie, then Accept-Language, then `en`. No locale in the URL.
Alternatives: next-intl with locale routing; Arabic-Indic digits.
Reason: minimal dependencies for the foundation; see ADR-005.
Consequences: these defaults must be confirmed by the product owner; locale-prefixed URLs would need a new ADR.

## ADR-011: Custom UI primitives instead of the shadcn/ui CLI
Context: the brief names shadcn/ui and React Hook Form.
Decision: `components/ui/*` are hand-written primitives (cva + tailwind-merge) in the shadcn style. React Hook Form is declared but not yet used; forms use `useActionState`.
Reason: no generated code was pulled in during the foundation phase.
Consequences: either adopt React Hook Form for complex forms or remove the dependency (open item in docs/STATUS.md).
