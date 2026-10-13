# Database Architecture

## Decision
PostgreSQL + Prisma 7. Prisma 7 configures the database URL in prisma.config.ts and the schema uses provider = postgresql. See the official Prisma documentation for Prisma 7 data sources.

## Foundation entities
- Organization: tenant boundary.
- User: identity.
- OrganizationMember: user membership in an organization.
- Role: coarse-grained organization role.
- Permission: atomic capability.
- RolePermission: role-to-permission mapping.
- Account / Session / VerificationToken: Auth.js persistence.
- AuditLog: immutable security/audit trail.

## Tenant isolation
Business resources must contain organizationId or be reachable only through an organization-scoped parent. Every repository/use-case query must receive organization context from the authenticated server session. Cross-entity relations also carry organizationId and are protected by composite PostgreSQL foreign keys so application mistakes cannot create cross-tenant references.

Never accept organizationId from the client as authority.

## Integrity
Use PostgreSQL foreign keys, unique constraints, indexes, and transactions. Monetary business data should use Decimal rather than Float.

## Migration policy
Every schema change requires a committed Prisma migration. Never edit a production database manually and never silently rewrite migration history.

## Current state
- All business tables (Property, Unit, Tenant, Lease, Payment, Expense, MaintenanceRequest) carry a mandatory `organizationId`; money columns are `Decimal(18,2)`. See ADR-006 and the migrations in `prisma/migrations/`.
- Cross-entity relations use composite foreign keys `(id, organizationId)`, so a child cannot reference a parent of another organization even if application code is wrong (covered by `tests/integration/tenant-isolation.integration.test.ts`).
- `Permission` / `RolePermission` tables exist, but the **source of truth for grants is `lib/authorization/permissions.ts`**; the tables are not seeded or read at runtime (see docs/STATUS.md and ADR-007).
- `PasswordResetToken` stores only a SHA-256 hash of the token; `LoginRateLimit` backs persistent rate limiting.

## Known gaps (not implemented)
- `AuditLog` is append-only by convention only. There is no database trigger or restricted role preventing UPDATE/DELETE. A naive trigger would break the `ON DELETE SET NULL` foreign keys, so it needs a deliberate design (ADR required).
- `MaintenanceRequest.priority` and `status` are free `String` columns; they should become enums via a migration.
- No `File`, `Notification` or `Building` model. "Building" is currently represented by `Property`; confirm whether a separate level is wanted (docs/STATUS.md, decision 3).
- `Tenant.nationalId` is stored in plain text; decide on field-level encryption before real data is stored.
- `User.role` duplicates `OrganizationMember.role` (transitional; the membership role is authoritative). `User.email` is globally unique, so one email belongs to one user across organizations.
- No Row Level Security. Isolation relies on organization-scoped queries plus composite foreign keys.
