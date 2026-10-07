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
