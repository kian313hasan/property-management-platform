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
- lib/auth: authentication configuration.
- lib/authorization: policy checks and organization context.
- lib/validation: Zod schemas.
- lib/errors: safe application errors.
- lib/logging: structured logging.
- lib/db: Prisma access.
- app/api: HTTP API boundary.

## Security boundaries
Trusted: server session, server-derived organization membership, validated server-side inputs.
Untrusted: all browser fields, route params, query params, uploaded files, and untrusted headers.

## Folder structure
See docs/DEVELOPMENT.md for the canonical structure and dependency rules.
