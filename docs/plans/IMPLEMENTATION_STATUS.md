# Implementation Status

Reflects the repository at the end of Stage B4 (Attendance). Every "verified" claim names the test or command that verifies it. Anything not listed here is **not implemented**. The Phase 0 documents under `docs/audit/` describe the system *before* this work; the resolution table in `DEFECT_RISK_REGISTER.md` maps each finding to its outcome.

## Verification summary (run 2026-09-20)
| Check | Result |
|---|---|
| Backend `tsc --noEmit` / `nest build` | pass |
| Backend e2e (Jest + supertest, real Postgres 15) | **185 passed** in 5 suites (`backend/test`); 44 unit tests (`working-days.spec.ts`, `timezone.spec.ts`) |
| Frontend `tsc -b` / `vite build` | pass |
| Frontend unit + component tests (Vitest) | **125 passed** (`npm test`) |
| Live frontend ↔ backend contract (`src/api/live.contract.test.ts`, `LIVE_API=true`) | **7 passed** against a running API |
| Frontend lint | 14 errors / 1 warning remain (was 86 / 4); all in modules not yet migrated |
| Migrations | 5, applied cleanly to an empty DB; migration 2 also verified on populated data and for duplicate-blocking; no drift vs `schema.prisma` |

## Done and verified
| Area | What exists | Evidence |
|---|---|---|
| Build hygiene | Compiled `.js` no longer committed; `nest-cli.json`/`tsconfig.build.json` filled; dependencies declared; lockfile consistent; `.env.example`; migrations tracked; compose project named `hrms` with env-driven ports | `npm ci --dry-run`, `nest build`, `prisma migrate deploy` |
| Authentication | bcrypt login (timing-safe for unknown users), organization selected by slug, throttled login/sign-up, sign-up creates org + admin atomically and cannot self-assign roles, refresh-token rotation with reuse detection, logout, inactive user/org rejected immediately | `security.e2e-spec.ts`, `global-and-sessions.e2e-spec.ts` |
| Authorization | Global JWT + role guards (`@Public()` opt-out); role/tenant/active state re-read from DB per request; only ADMIN manages admins; HR cannot escalate | `security.e2e-spec.ts` |
| Tenant isolation | Every query scoped to the caller's tenant; cross-tenant read/update/delete return 404; client tenant headers ignored; forged tenant claim rejected | `security.e2e-spec.ts`, `employees.e2e-spec.ts` |
| Data model | Per-tenant uniqueness, indexes, Decimal money with ISO 4217 currency, protected payslips/documents, audit log, refresh tokens | migrations + e2e |
| Audit trail | auth events, tenant/user/employee/department changes; secrets and pay values redacted | e2e "audit trail" tests |
| Global regional settings | Per-organization country, language, timezone, currency, week start, fiscal year; validated against ICU data (any country); settings API | `global-and-sessions.e2e-spec.ts` (6 countries) |
| Employees & departments | Paginated/searchable/filterable directory, create-with-login, update, terminate (revokes access), reporting-line integrity, field-level privacy for pay/identity data | `employees.e2e-spec.ts` (46 tests), `Employees.test.tsx`, live contract |
| Frontend session & routing | Real login/sign-up, session restore on reload, single-flight token refresh, role-aware routes from the navigation config | `http.test.ts`, `ProtectedRoute.test.tsx` |
| Leave | Requests, approvals (manager of the employee, HR or admin; never your own), rejection with reason, cancellation rules, per-type annual entitlements, balances (entitlement/used/pending/remaining), team and organization views, holidays, overlap protection, balance enforced under concurrency (advisory lock), audit events. Working days come from a **per-organization calendar** (configurable weekend days and holidays), computed identically on server and client | `leave.e2e-spec.ts` (43), `working-days.spec.ts` (16), `LeaveManagement.test.tsx` (17), live contract |
| Attendance | Clock in/out with one record per employee per **organization-local** day; forgotten sessions become stale and need a correction; corrections (request local times → manager/HR approve, never your own, one pending per day, 31-day window, overnight shifts, decided once) that write the record atomically on approval; own/team/all views by date range; summary of present, approved-leave, absent and rest-day work from the organization's weekend/holiday calendar; concurrency-safe; audit events | `attendance.e2e-spec.ts` (35), `timezone.spec.ts` (28), `Attendance.test.tsx` (17), live contract |
| Global formatting | Money/date/number follow the organization's locale, timezone, currency | `format.test.ts` |
| Jurisdiction packs | Country-specific identifiers/allowances/end-of-service/payroll export isolated per country with a neutral fallback | `packs.test.ts` |

## Not done (still mock or missing)
Everything below still runs on sample data in the UI, or has no backend, and must not be presented as functional:

- **Frontend pages on mock data:** Dashboard, Payroll (labelled "Sample data"), Expenses, Documents, Onboarding, Offboarding, Reports, Profile, Org chart, Plans & Billing, all Recruitment and Performance pages, notifications, AI assistant.
- **Backend stubs:** payroll (summary returns zeros), documents (no upload endpoint), admin stats, notifications (no endpoints). They now require authentication and roles, but return placeholder data.
- **Not built:** permission/module registry and Super Admin control centre, workflow engine (leave and attendance corrections use a single decision by the manager or HR; multi-level approval chains, accrual, carry-forward, half days, leave attachments, and email/in-app notifications on decisions are not built), shifts and schedules, lateness/early-departure rules, overtime, payroll engine, recruitment, performance, expenses, analytics, integrations, learning, benefits, helpdesk.
- **Payroll engine:** the queue processor is jurisdiction-neutral (no hardcoded tax; explicit rate input) but is not wired to any API. No statutory calculation has been validated for any country.
- **Jurisdiction packs:** identifier formats are input hints, not server-side validation. The UAE gratuity and WPS modules are draft implementations and are offered only to organizations whose country is AE; they need legal validation before real payouts.
- **Security gaps:** refresh token is kept in `localStorage` (an httpOnly cookie is stronger); no MFA or password-reset flow; OAuth sign-in only links existing users and Microsoft matching is by provider id only; secrets are environment variables (no vault); file upload validation not built because uploads are not built.
- **Operational:** no CI pipeline; no load/performance testing; accessibility checked only for the new dialog/form patterns, not audited.

## Leave: behaviours to be aware of
- A request cannot span two calendar years (submit one per year); entitlements are per calendar year with no accrual or carry-forward.
- Every day is a whole day (no half days). Days already taken before this system was adopted are not imported.
- Holidays are entered manually per organization; there is no built-in public-holiday data for any country.
- The previous mock UI showed a two-stage manager → HR chain that never existed on any backend; the real flow is one decision.
- Weekend defaults are suggestions by country (Friday/Saturday for a list of countries, Saturday/Sunday otherwise) and are editable; they are not legal advice and can differ by sector.

## Attendance: behaviours to be aware of
- One record per employee per day (a single in/out pair). Split shifts and multiple sessions in a day are not supported; use a correction to record the total span.
- There are no shifts, schedules, lateness or overtime rules, so status is always "present"; nothing is flagged late. Those need per-organization policies and are not invented here.
- No GPS, IP, device or biometric capture, and no geofencing. Clock times are taken from the server clock; the client cannot set them.
- A session left open for more than 20 hours is "stale": it cannot be closed by clocking out and must be fixed with a correction. There is no automatic close.
- Corrections can be requested for the last 31 days; older dates need HR to change the data directly (no UI for that yet).
- The summary counts a day as "absent" only when it is over, a working day, has no attendance and no approved leave; pending leave does not count. It does not consider partial days or half-day leave.
- Payroll integration is not built: the summary is a validated data source, not a payroll input.

## Known issues to be aware of
- Login with an organization slug is required; there is no "find my organization" flow.
- Dates of birth, addresses and similar fields exist in the API but the Employees form does not yet expose all of them.
- The Employees form loads up to 100 active employees for the manager picker; large organizations need a searchable picker.
- The frontend `package.json` still contains backend dependencies (NestJS, Prisma, …); they should be removed in a dedicated cleanup.

## Next stages (proposed order)
1. Documents (upload endpoint, S3/MinIO, type/size validation, malware-scan hook) → Notifications (leave and attendance decisions first) → shifts/schedules.
2. Thin permission layer (`module.feature.action` strings) and module registry, then the Super Admin control centre.
3. Payroll engine with jurisdiction adapters; each country needs validated rules, effective dates and test vectors.
4. Recruitment, performance, engagement, expenses, analytics.
