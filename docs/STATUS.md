# Foundation status

Honest state of the foundation phase. Update this file whenever a gap is closed or discovered. Last reviewed: 2026-10-13. Local execution was not possible (no package registry access); verification comes from GitHub Actions on PR #1 (CI `quality` and `e2e` jobs green on the latest commit; `Dependency review` fails because the repository's Dependency graph setting is disabled; CodeQL green).

## Done (implemented, per code review)
Organization-scoped schema with composite FKs and Decimal money; Auth.js credentials login with rate limiting; password-reset token logic; closed registration; permission matrix; safe error mapping; structured logger with redaction; env schema validation; audit service (auth + role changes); i18n (ar/en/fa) with RTL/LTR layout and Intl formatting; UI primitives; Docker + compose; CI (lint, typecheck, tests, build, audit, CodeQL, dependency review); docs.

## Not done / open
1. **Merge:** all work is on `foundation-completion` (PR #1) and still has to be merged into `main`.
2. **Lockfile out of sync** with package.json (see Dockerfile comment). CI and Docker use `npm install`; switch to `npm ci` after regenerating `package-lock.json` with network access.
3. **Authorization partly centralised:** server actions now use `hasPermission` (done) and `propertyScope`; pages (e.g. dashboard, lists) still hard-code role arrays and should move to the same helpers.
4. **Tests:** IDOR scoping is tested at query level (`idor.integration.test.ts`); there are still no tests that invoke server actions as each role, no API security tests, and E2E has one smoke test.
5. **Audit coverage:** create events for business resources and users are now recorded; there are no update/delete flows yet. Audit log immutability is still not enforced.
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
