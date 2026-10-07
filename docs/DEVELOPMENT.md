# Development Guide

## Canonical structure
app/ = routes, pages, route handlers
components/ = reusable UI
lib/auth/ = authentication
lib/authorization/ = RBAC and organization policies
lib/db/ = database access
lib/errors/ = safe application errors
lib/logging/ = structured logging
lib/validation/ = Zod schemas
lib/config/ = runtime configuration
i18n/ = locale configuration and translation resources
tests/unit, tests/integration, tests/e2e = test layers
prisma/ = schema and migrations
docs/ = architecture documentation
.github/workflows/ = CI

## Rules
1. UI does not query Prisma directly.
2. Server actions/routes do not contain reusable domain policy.
3. Business writes require validation and authorization.
4. Never trust organization IDs supplied by browsers.
5. No any without a documented, unavoidable boundary.
6. Schema changes require migrations.
7. API changes require contract documentation.
8. New dependencies require a documented reason.
9. Do not remove security controls to unblock development.

## Local setup
Copy .env.example to .env, start PostgreSQL with Docker, install dependencies, run Prisma migrations, then run lint, typecheck, unit tests, and E2E checks.

## Verification
CI is the authoritative baseline. Local success is not a substitute for CI.
