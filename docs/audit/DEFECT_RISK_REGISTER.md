# Defect & Risk Register

All items pre-existing (nothing has been changed by this audit). "Evidence" = code inspection (V) unless marked RT (runtime-confirmed). Runtime validation of S-series is blocked by B03/B04.

## Security (S)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| S01 | Critical | `AuthService.login` never compares the password; anyone with an email gets a JWT | `backend/src/auth/auth.service.ts` login (lines ~37-48) (V) |
| S02 | Critical | Public `POST /auth/register` accepts `role` (incl. ADMIN) | `auth/dto/register.dto.ts:27-30` (V) |
| S03 | Critical | Tenant is taken from client `X-Tenant-Id` header and `TenantMiddleware` is never registered (`app.module.ts` has no `configure()`); JWT tenant not enforced on later requests | `app.module.ts`, `common/middleware/tenant.middleware.ts` (V) |
| S04 | Critical | Cross-tenant IDOR: `GET/PATCH/DELETE /users/:id` are not tenant-scoped; `GET /users/:id` open to any authenticated role | `users/users.controller.ts:14-58`, `users.service.ts:61-151` (V) |
| S05 | High | HR can escalate privileges: `UpdateUserDto` allows `role`, `isActive`, OAuth ids | `users/dto` (V) |
| S06 | High | Employees/attendance/leave/payroll/documents/admin controllers have no guards | each `*.controller.ts` (V) |
| S07 | High | `simple-server.js` returns users (incl. password hashes) unauthenticated | `backend/src/simple-server.js` (V) |
| S08 | High | JWT strategy trusts role/tenant from token, does not check `isActive`; no refresh/revocation | `auth/strategies/jwt.strategy.ts` (V) |
| S09 | High | OAuth links accounts by unverified email and auto-creates users; callbacks return raw `req.user` | `auth.service.ts:66-89`, `auth.controller.ts` (V) |
| S10 | Medium | Throttler configured with `ttl: 60` (ms in v5) and no `APP_GUARD` → not enforced | `app.module.ts:27-30` (V) |
| S11 | Medium | CORS fully open; Swagger enabled in all environments; Prisma logs every query | `main.ts:18,33-50`, `prisma.service.ts:8` (V) |
| S12 | Medium | Hardcoded `minioadmin` fallback credentials; default `postgres/postgres` in compose with ports published | `s3.service.ts:43-53`, `docker-compose.yml` (V) |
| S13 | Medium | Frontend: mock tokens in localStorage, demo credentials shown on login page and README, no route-level RBAC (all four roles allowed on every route) | `authSlice.ts`, `App.tsx`, `Login.tsx` (V) |
| S14 | Medium | Sensitive data stored plaintext/Float: bank account, salary | `schema.prisma` (V) |
| S15 | Low | Root `.gitignore` does not ignore `.env` | root `.gitignore` (V) |

## Backend build / runtime (B)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| B01 | High | 55 compiled `.js` files committed beside `.ts` (`allowJs`), shadowing sources | RT: startup crash on `auth.controller.js` (BASELINE row 10) |
| B02 | High | Empty files: `nest-cli.json`, `tsconfig.build.json`, `init.sh`, `setup.sh/ps1`, `fix-*`, `TROUBLESHOOTING.md`, `seed.ts/js` | file sizes (V) |
| B03 | High | `nest build` fails (no `experimentalDecorators` in empty `tsconfig.build.json`) | RT (row 7) |
| B04 | High | `@nestjs/bull`, `passport-local` (+types) not in `backend/package.json`; backend boot fails on BullExplorer via root's v11 | RT (row 11) |
| B05 | High | `backend/package-lock.json` out of sync (`npm ci` fails) | RT (row 4) |
| B06 | High | `withTenant()` wrapper uses `this` incorrectly → `GET /users` (`findAll`) breaks; also the only `tsc` error | `prisma.service.ts:24-78`, `users.service.ts:47` (V; tsc RT) |
| B07 | Medium | `express ^5` in backend deps vs Nest 10 platform-express (Express 4); `typescript ^4.9` old; aws-sdk v2 EOL; multer 1.x vulnerable | `package.json`, install warnings |
| B08 | Medium | `DEFAULT_TENANT` is a name, not an id; no config validation despite `joi` dep | `config/configuration.ts` (V) |
| B09 | Medium | Docker: runs as root, no healthcheck, project name `backend` collides with other local compose projects | `Dockerfile`, `docker-compose.yml` (RT incident, BASELINE) |
| B10 | Medium | No consistent response envelope, exception filter, audit log, or `enableShutdownHooks` | `main.ts`, `common/` (V) |
| B11 | Low | `PayrollProcessor` never enqueued; hardcoded 20% tax; `DocumentsService.uploadDocument` doesn't write a `Document` row | `payroll.processor.ts:39`, `documents.service.ts` (V) |

## Database (D)
| ID | Sev | Finding |
|---|---|---|
| D01 | Critical | Global `@unique` on `User.email` (`schema.prisma:34`), `Employee.employeeId` (:69), `googleId`, `microsoftId` defeats per-tenant uniqueness |
| D02 | High | `PerformanceReview` and `Goal` have no `tenantId` (outside tenancy) |
| D03 | High | No migrations exist and `/prisma/migrations/` is git-ignored |
| D04 | Medium | No `@@index` beyond uniques (tenantId, employeeId, date); no `(employeeId, date)` unique on Attendance |
| D05 | Medium | Money as `Float`; `Leave.approvedById` is a plain string, no relation; `onDelete: Cascade` from Tenant on payroll/document data (destructive) |
| D06 | Low | No audit/history tables (employment history, compensation history, config history) |

## Frontend (F)
| ID | Sev | Finding | Evidence |
|---|---|---|---|
| F01 | Critical (product) | 100% mock: no page persists or fetches from the backend; `db.json` unused | static inventory |
| F02 | High | Session restore bug: `user` null after reload while token persists → role-gated UI silently disappears, nav shows everything | `authSlice.ts`, `ProtectedRoute` (V) |
| F03 | High | API client `src/api/config.ts`: hardcoded `http://localhost:3000`, no auth header, no 401 handling, unused by app | (V) |
| F04 | Medium | Lint: 86 errors (68 `any`), see BASELINE row 2 | RT |
| F05 | Medium | No `manager` demo user, so manager branches (Leave, Expenses) unreachable | `authSlice.ts` (V) |
| F06 | Medium | Duplicate route trees, demo users ×4, employee datasets ×2, dead files (AUDIT §6) | (V) |
| F07 | Medium | Backend deps inside frontend `package.json`; dual PostCSS configs; absolute logo path under `base` | (V) |
| F08 | Low | No tests, no chart library, no data-fetching layer, no dark/theme config | (V) |

## Process risks (R)
| ID | Risk | Mitigation |
|---|---|---|
| R01 | Duplicate `All-in-One HRMS Platform-Source-Code/` folder staged for commit | Owner to unstage/remove |
| R02 | Local infra collisions (ports 3000/5432, compose project name `backend`) | Explicit `-p hrms` project name, distinct ports, `.env.example` |
| R03 | Scope: 10 product phases on a skeleton backend | Sequence in `docs/plans/GAP_ANALYSIS_AND_ROADMAP.md` |

---

## Resolution status (updated after Stage B2)

The tables above are the original findings (evidence as of Phase 0). Outcome per item:

| ID | Outcome | Where / how verified |
|---|---|---|
| S01 login skips password | **Fixed** | `security.e2e-spec.ts` (wrong password, unknown user/org: same 401) |
| S02 public register accepts role | **Fixed** (endpoint removed; throttled org sign-up; role rejected as unknown field) | e2e "rejects a client-supplied role", "rejects the removed /auth/register" |
| S03 client-controlled tenant | **Fixed** (tenant from DB-backed principal; header ignored) | e2e "ignores a client-supplied tenant header", "forged tenant claim" |
| S04 cross-tenant IDOR | **Fixed** for users, employees, departments, tenant settings | e2e tenant-isolation suites |
| S05 HR role escalation | **Fixed** (only ADMIN assigns/manages ADMIN; no self role change) | e2e "privilege escalation" |
| S06 unguarded stub controllers | **Fixed** (global auth; payroll/admin restricted to ADMIN/HR). Stubs still return placeholder data | e2e "authentication is required everywhere" |
| S07 `simple-server.js` | **Fixed** (removed) | git history |
| S08 token trusts role/isActive | **Fixed** (re-read per request; refresh tokens with rotation and revocation) | e2e "token lifetime is bound to the database", refresh suites |
| S09 OAuth unverified email / auto-create | **Fixed** (existing users only; Google verified email only; Microsoft by provider id). Not exercised end to end: no provider credentials in this environment | code review only: REQUIRES RUNTIME VALIDATION |
| S10 throttler unenforced | **Fixed** | e2e "returns 429" |
| S11 CORS/Swagger/query logging | **Fixed** | live CORS check; config |
| S12 hardcoded credentials | **Fixed** in code (S3 service); compose defaults are development-only and env-overridable | code review |
| S13 mock auth, no route RBAC, demo creds | **Fixed** (real auth; role rules from nav config; demo panel removed) | `ProtectedRoute.test.tsx`, live contract |
| S14 plaintext bank/Float salary | **Partly fixed**: Decimal money, field-level privacy. Bank/identity data is **not** encrypted at rest | e2e; see SECURITY_CONTROLS gaps |
| S15 `.env` not ignored (root) | **Open** (frontend uses `.env.local`, ignored via `*.local`; add `.env` to root `.gitignore`) | |
| B01–B05 build/runtime | **Fixed** | `nest build`, `npm ci --dry-run`, app boots |
| B06 `withTenant()` broken | **Fixed** (removed; explicit tenant scoping) | e2e |
| B07 dependency hygiene | **Partly fixed** (express 5, unused deps removed). aws-sdk v2, multer 1.x, TS 4.9 remain | install warnings |
| B08 config validation | **Fixed** (Joi, fail-fast) | boot |
| B09 Docker/compose | **Partly fixed** (project name, ports, healthchecks for Postgres). Dockerfile still runs as root | |
| B10 no envelope/filter/audit | **Partly fixed** (audit log added; no response envelope/exception filter) | |
| B11 dead payroll processor / flat tax | **Partly fixed** (no hardcoded tax, Decimal, idempotent) but still not wired to an API | |
| D01–D06 schema | **Fixed** (per-tenant uniques, tenantId on reviews/goals, indexes, Decimal, migrations tracked, audit table). History tables (employment/compensation) not yet built | migrations, e2e |
| F01 frontend 100% mock | **Partly fixed**: Auth, Employees, tenant settings, departments are real. All other modules remain mock | `IMPLEMENTATION_STATUS.md` |
| F02 session restore bug | **Fixed** | `authSlice` restore flow; live contract |
| F03 unused API client | **Fixed** (new typed client) | `http.test.ts` |
| F04 lint | **Partly fixed**: 86 → 14 errors | `npm run lint` |
| F05 no manager demo user | **Obsolete** (no demo users) | |
| F06/F07 duplicates & dead code | **Partly fixed** (dead files removed, PostCSS duplicate and backend deps in frontend `package.json` remain) | |
| F08 no tests | **Fixed** for the migrated modules (87 tests + live contract). No tests for unmigrated pages | |
| R01 duplicate folder | **Fixed** (removed, commit `afc7ba2`) | |
| R02 local infra collisions | **Partly fixed** (compose project `hrms`, non-default ports). Incident: an earlier compose run replaced another project's containers; see `BASELINE_STATUS.md` | |
