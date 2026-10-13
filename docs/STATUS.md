# Foundation status

Honest state of the foundation phase. Update this file whenever a gap is closed or discovered. Last reviewed: 2026-10-13 by static review only; **lint, typecheck, unit/integration/E2E tests and the Docker build were NOT run in that review** (no package registry access), so nothing here is verified by execution.

## Done (implemented, per code review)
Organization-scoped schema with composite FKs and Decimal money; Auth.js credentials login with rate limiting; password-reset token logic; closed registration; permission matrix; safe error mapping; structured logger with redaction; env schema validation; audit service (auth + role changes); i18n (ar/en/fa) with RTL/LTR layout and Intl formatting; UI primitives; Docker + compose; CI (lint, typecheck, tests, build, audit, CodeQL, dependency review); docs.

## Not done / open
1. **Verification:** the working tree has ~50 uncommitted changes on branch `foundation-completion`; none of the checks has been confirmed green.
2. **Lockfile out of sync** with package.json (see Dockerfile comment). CI and Docker use `npm install`; switch to `npm ci` after regenerating `package-lock.json` with network access.
3. **Authorization is not centralised:** actions and pages hard-code role arrays instead of `requireRolePermission`; the roles in code differ from the matrix (e.g. dashboard lets PROPERTY_MANAGER see finance data).
4. **No per-action tests:** no IDOR/cross-tenant tests at the action level, no authorization-by-role tests for actions, no API security tests, E2E has one smoke test.
5. **Audit coverage:** only auth, role-change and password-reset events are recorded; create/update/delete of business resources are not. Audit log immutability is not enforced.
6. **i18n not applied to pages:** most pages and every server-action error message are hard-coded Arabic with `dir="rtl"`. English/Persian users see Arabic.
7. **Design system not applied:** pages bypass `components/ui`. (React Hook Form was removed, ADR-011.)
8. **Email/storage are local-only by decision (ADR-012):** the reset link is printed to the console outside production; there is no file storage yet.
9. **File management, notifications, reports** have no schema, no architecture code and no docs beyond env placeholders.
10. **Money input** in actions uses `z.coerce.number()` instead of `moneySchema` and converts via floating point.
11. **CSP** allows `unsafe-inline`; no nonce. JWT sessions cannot be revoked. No MFA.
12. **CI hardening:** actions are pinned by tag, not commit SHA; required-check/branch-protection settings are GitHub settings and cannot be verified from the repo.
13. `MaintenanceRequest.priority/status` are strings, not enums; `Tenant.nationalId` is plain text.
14. A full attacker-style security review (phase 19) has not been performed.

## Decisions confirmed (2026-10-13)
Property -> Unit hierarchy stays (no Building level); Western digits and Gregorian calendar for all locales (ADR-010); custom UI primitives kept, react-hook-form removed (ADR-011); no external services, local operation only (ADR-012).

## Decisions still open
1. Per-organization custom roles (would change ADR-007).
2. Multi-organization users: the active organization is chosen by a cookie validated against memberships; confirm this is the desired UX.
