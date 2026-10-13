# Architecture

## Status
Foundation phase. No new business feature is introduced by this document.

## System boundaries
- Next.js App Router: UI, server components, route handlers, and server actions.
- Domain/application layer: authorization, validation, use-case orchestration, and error mapping.
- Infrastructure layer: Prisma/PostgreSQL, Auth.js, logging, storage/email adapters.
- UI layer: Tailwind + shadcn/ui primitives, locale-aware RTL/LTR rendering.
- Tests: Vitest for unit/integration boundaries and Playwright for browser E2E.

## Target request flow
Browser -> Next.js route -> authentication -> organization context -> authorization -> validation -> application service -> repository/Prisma -> safe response.

Client-provided organization IDs are never trusted. Organization context is derived from the authenticated session and membership lookup.

## Multi-tenancy
The tenant boundary is Organization. Every business resource must carry an organizationId (or belong through a parent that carries one). Queries must scope by the server-derived organization context. Cross-organization access is denied by default.

## Authentication
Auth.js is retained as the authentication boundary. Credentials are supported for the current application, but the long-term design allows OAuth, email links, and passkeys without changing authorization.

## Authorization
Authentication answers who are you? Authorization answers may this identity perform this action on this resource in this organization? Authorization is server-side and combines role/permission checks with organization and ownership checks.

## Frontend architecture
app/ contains routes and page composition. Reusable UI belongs in components/. Translation resources belong in i18n/. Domain/business logic must not be embedded in presentational components.

## Backend architecture
- lib/auth.ts, lib/auth.config.ts: Auth.js configuration (JWT sessions, credentials provider).
- lib/authorization: permission matrix (`permissions.ts`), policy helpers (`policy.ts`), organization context (`organization.ts`).
- lib/validation: Zod schemas shared by actions and routes.
- lib/errors: `AppError` and safe HTTP error mapping.
- lib/logging: structured JSON logger with redaction.
- lib/audit: audit event recording.
- lib/security: rate limiting, password reset, client IP helpers.
- lib/config: environment schema and validation.
- lib/prisma.ts: the single Prisma client (there is no `lib/db/` directory).
- actions/: server actions (the current write boundary). app/api/: only the Auth.js route today.
- proxy.ts: coarse authentication gate (not an authorization boundary).

## Security boundaries
Trusted: server session, server-derived organization membership, validated server-side inputs.
Untrusted: all browser fields, route params, query params, uploaded files, and untrusted headers.

## Folder structure
See docs/DEVELOPMENT.md for the canonical structure and dependency rules.

## Known deviations from the target architecture
Pages and server actions still contain role checks (`["SUPER_ADMIN","PROPERTY_MANAGER"].includes(role)`) and Prisma queries inline, and user-facing strings are hard-coded in Arabic with `dir="rtl"` in most pages. The target is: permission checks through `requireRolePermission`, data access in a service layer, text through `t()` from `i18n/`. See docs/STATUS.md for the list.
