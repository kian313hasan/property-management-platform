# Foundation status

Honest state of the foundation phase. Update this file whenever a gap is closed or discovered. Last reviewed: 2026-10-13. Local execution was not possible (no package registry access); verification comes from GitHub Actions on PR #1 (CI `quality` and `e2e` jobs green on the latest commit; `Dependency review` fails because the repository's Dependency graph setting is disabled; CodeQL green).

## Done (implemented, per code review)
Organization-scoped schema with composite FKs and Decimal money; Auth.js credentials login with rate limiting; password-reset token logic; closed registration; permission matrix; safe error mapping; structured logger with redaction; env schema validation; audit service (auth + role changes); i18n (ar/en/fa) with RTL/LTR layout and Intl formatting; UI primitives; Docker + compose; CI (lint, typecheck, tests, build, audit, CodeQL, dependency review); docs.

## Not done / open
1. **Merge:** work in progress is on branch `audit-roles-e2e` (PR #14); PR #1 and PR #12 are merged.
2. **Lockfile out of sync** with package.json (see Dockerfile comment). CI and Docker use `npm install`; switch to `npm ci` after regenerating `package-lock.json` with network access.
3. **Authorization partly centralised:** server actions now use `hasPermission` (done) and `propertyScope`; pages (e.g. dashboard, lists) still hard-code role arrays and should move to the same helpers.
4. **Tests:** server actions are tested per role against PostgreSQL (permission matrix, organization/manager isolation, money, audit trail); E2E covers login/logout, role navigation, language/direction, security headers and the full rental flow. Not covered: update/delete flows (none exist), API route security (only the Auth.js route exists), accessibility and visual checks, the dev server.
5. **Audit:** create events are recorded and the log is append-only via a DB trigger (ADR-013). Remaining: no update/delete flows to audit yet; a DB superuser can drop the trigger; no restricted application DB role.
6. **i18n:** pages, forms, error pages and server-action errors now use `t()` / translation keys (`actionErrors.*`); `tests/unit/ui-conventions.test.ts` fails if Arabic/Persian text, `dir="rtl"` or `toLocale*String` reappear in `app/`, `actions/`, `components/` or `lib/`. The site title and description are translated (`generateMetadata`).
7. **Design system:** every page now uses `AppShell`, `FormPage`, `ActionForm` and `components/ui`; the login page keeps its dark backdrop by design. No accessibility audit or visual regression tests yet.
8. **Email/storage are local-only by decision (ADR-012):** the reset link is printed to the console outside production; there is no file storage yet.
9. **File management, notifications, reports** have no schema, no architecture code and no docs beyond env placeholders.
10. **Money:** inputs are validated with `moneyField` and passed to Prisma as decimal strings; totals are summed in the database. A unit test forbids `Number()`/`parseFloat()`/`toNumber()` in server actions. `formatAmount` converts to a JS number only for display.
11. **CSP** allows `unsafe-inline`; no nonce. JWT sessions cannot be revoked. No MFA.
12. **CI hardening:** actions are pinned by tag, not commit SHA; required-check/branch-protection settings are GitHub settings and cannot be verified from the repo.
13. `MaintenanceRequest.priority/status` are strings, not enums; `Tenant.nationalId` is plain text.
14. A full attacker-style security review (phase 19) has not been performed.

## Decisions confirmed (2026-10-13)
Property -> Unit hierarchy stays (no Building level); Western digits and Gregorian calendar for all locales (ADR-010); custom UI primitives kept, react-hook-form removed (ADR-011); no external services, local operation only (ADR-012).

## Decisions still open
1. Per-organization custom roles (would change ADR-007).
2. Multi-organization users: the active organization is chosen by a cookie validated against memberships; confirm this is the desired UX.
