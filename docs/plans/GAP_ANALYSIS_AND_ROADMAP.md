# Gap Analysis & Prioritized Roadmap

Status: **proposal, nothing below is implemented.** Sequencing principle: nothing new is built on a skeleton that cannot start, has no tenant isolation, and cannot be tested. Each plan needs approval before execution.

## Gap summary
The UI breadth is large (≈25 screens) but is entirely mock. The backend is a skeleton with two real modules and critical security defects. The gap is therefore: (a) make the backend buildable and safe, (b) connect the UI to it module by module, (c) then add the Meridian phases (Hub features).

## Stage A — Foundation (blocking; do first)
| Plan | Objective | Main changes | Acceptance |
|---|---|---|---|
| **A1 Repo hygiene** | Buildable, reproducible backend | Remove 55 committed `.js` + add `*.js` ignore under `backend/src`; fill `nest-cli.json`, `tsconfig.build.json` (experimentalDecorators); declare `@nestjs/bull`, `passport-local`; regenerate `backend/package-lock.json`; `.env.example` (names only); stop ignoring `prisma/migrations`; set compose `name: hrms` + non-default ports; remove duplicate nested folder (owner approval); split frontend/backend deps | `npm ci`, `tsc`, `nest build`, backend boots; git tree clean after build |
| **A2 Security hotfixes** | Close S01–S12 | Verify password (bcrypt) in login; strip `role`/`tenantId` from public register (invite/admin-only role assignment); tenant from validated JWT only, register `TenantMiddleware`/guard globally; tenant-scope every users query; fix `withTenant()`; global JwtAuthGuard + RolesGuard with public opt-out; throttler guard + ms ttl; restrict CORS/Swagger by env; delete or lock `simple-server.js`; DTO restricts updatable fields | Auth/tenant unit + e2e tests: wrong password 401, register role ignored, cross-tenant access 404, unauthenticated 401 |
| **A3 Schema baseline** | Real tenancy + migrations | Baseline migration; composite uniques; `tenantId` on Performance/Goal; indexes; Attendance unique(employee,date); Decimal money; seed (tenant, users per role) | `prisma migrate deploy` on empty DB; seed idempotent |
| **A4 Test harness** | Regression safety | Jest+supertest e2e on backend (Postgres test DB); Vitest + Testing Library + MSW on frontend; CI script (lint, tsc, build, test); fix 86 lint errors incrementally | `npm test` green in both |

## Stage B — Connect the UI (existing features first)
- **B1** Central API client (env base URL, auth header, 401 handling, typed contracts), React Query, `/auth/me` for session restore, real login; remove MSW default-on and duplicate demo data; route-level role guards.
- **B2** Employees + Departments end-to-end (DTO, tenant-scoped service, pagination/filter/sort, audit log, permission checks) → then Documents (upload endpoint + Document row, validation) → Leave → Attendance → Payroll read paths → Notifications. One module per PR with API + UI + tests.

## Stage C — Hub features (Meridian phases 1–10, order preserved)
1. Core HR & lifecycle (history, effective-dated changes, change requests, onboarding/offboarding tasks, bulk import).
2. Workforce: shifts, policies, balances/accrual, regularization, holiday calendars.
3. Payroll & compensation: jurisdiction-aware rule model, runs (idempotent, lockable), approvals, payslips, reversals, deterministic calculation tests; legal validation is out of scope of engineering.
4. Recruitment (new models), 5. Performance/talent, 6. Engagement/helpdesk, 7. Expenses/travel/timesheets, 8. Analytics + permission-aware AI, 9. Super Admin control centre (module/feature registry, tenant/plan entitlements, custom roles with `module.feature.action` permissions, audit/config history), 10. Performance/security/QA hardening.
Note: the permission model (Stage C.9) is pulled forward as a **thin RBAC core** in Stage A2/B (permission strings + guard) so later modules are built against it rather than retrofitted.

## Decisions needed from the owner
1. Approve deleting the staged duplicate folder and the committed compiled `.js`.
2. Confirm target DB for dev (isolated compose project name/ports) and whether any real data exists anywhere (affects migration strategy).
3. Payroll jurisdictions in scope (UAE helpers exist client-side).
4. Whether the frontend base path `/__-portfolio/hrms/` is a real deployment requirement.
5. AI provider and data-privacy stance before any AI feature.

## Definition of done per plan
Frontend + API + persistence + validation + permission checks + tests passing + docs updated; no mock in persisted workflows.
