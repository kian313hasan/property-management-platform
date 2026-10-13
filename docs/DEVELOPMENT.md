# Development Guide

## Canonical structure
app/ = routes, pages, route handlers
components/ = reusable UI
lib/auth.ts + lib/auth.config.ts = authentication
lib/authorization/ = RBAC and organization policies
lib/prisma.ts = Prisma client
lib/audit/, lib/security/ = audit events, rate limiting, password reset
actions/ = server actions
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

## Rules for AI agents and contributors
1. Read the files related to a task before editing them; do not change files outside the task without need.
2. Architecture changes are recorded in docs/DECISIONS.md in the same change; never change a decision silently.
3. Schema changes always ship a Prisma migration; API changes update docs/API-CONTRACT.md.
4. No new dependency without a documented reason (check maintenance, security, ecosystem, compatibility).
5. Do not break or delete existing tests; never remove a security control to make development easier.
6. No duplicate implementations: reuse `lib/authorization`, `lib/validation`, `lib/errors`, `lib/audit`.
7. Do not describe the project as "secure" or "production-ready" without evidence (passing tests and a recorded review).
8. Update docs/STATUS.md when a gap is closed or a new one is found.

## Verification commands
`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration` (needs PostgreSQL), `npm run build`, `npm run test:e2e`.
