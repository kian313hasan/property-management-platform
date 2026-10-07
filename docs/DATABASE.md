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
Business resources must contain organizationId or be reachable only through an organization-scoped parent. Every repository/use-case query must receive organization context from the authenticated server session.

Never accept organizationId from the client as authority.

## Integrity
Use PostgreSQL foreign keys, unique constraints, indexes, and transactions. Monetary business data should use Decimal rather than Float.

## Migration policy
Every schema change requires a committed Prisma migration. Never edit a production database manually and never silently rewrite migration history.

## Current-state note
The repository still contains the earlier SQLite-oriented business schema. This foundation phase establishes the PostgreSQL target and tenancy model, but the existing business tables are not yet fully migrated to organization ownership. That migration is a required gate before business features are declared production-ready.
