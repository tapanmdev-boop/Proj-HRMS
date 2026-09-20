# Existing System Audit — Meridian HRMS

Audit date: 2026-09-20. Scope: Phase 0 (read-only, no source changes). Evidence classes: VERIFIED, PARTIALLY IMPLEMENTED, UI ONLY, BACKEND ONLY, MOCK / PLACEHOLDER, MISSING, REQUIRES RUNTIME VALIDATION.

## 1. Repository layout
- Git root `Proj-HRMS/` is canonical: frontend at the root (`src/`, `package.json`, `vite.config.ts`), backend in `backend/`.
- `All-in-One HRMS Platform-Source-Code/` (212 files, staged but uncommitted) is a byte-identical duplicate of the root apart from `backend/package-lock.json`. It is ignored by this audit. Recommendation: unstage/delete it (needs owner decision).
- Frontend and backend have **separate** `package.json` files, but the frontend `package.json` also lists the whole NestJS stack (`@nestjs/*`, prisma, bcrypt, bull, aws-sdk, sendgrid, jest…). The backend resolves some packages from the root `node_modules` when its own are missing (see BUG-B04).

## 2. Technology inventory (VERIFIED from package.json / source)
| Area | Finding |
|---|---|
| Frontend | React 19.1, TypeScript ~5.8, Vite 6, react-router-dom 6.30, Redux Toolkit 2.8 (auth slice only), Tailwind 3.3 |
| UI libs | None (no MUI/shadcn); hand-rolled components; no chart lib (divs/SVG); no form lib; no data-fetching lib (no React Query/axios) |
| Frontend tests | None. No test script, no Vitest/Testing Library |
| Mock tooling | MSW (on by default in dev, `VITE_USE_MOCKS !== 'false'`), `db.json` (unused by any script) |
| Backend | NestJS 10, Prisma 5.22, PostgreSQL, Passport (JWT, Google, Microsoft OAuth, `passport-local` used but undeclared), bcrypt, Bull (`@nestjs/bull` imported but undeclared in `backend/package.json`), SendGrid, AWS S3 (aws-sdk v2, MinIO defaults), pdfkit, Swagger, helmet, throttler |
| Backend tests | None (`test:e2e` points to a missing `test/jest-e2e.json`) |
| Migrations | None. `/prisma/migrations/` is git-ignored (`backend/.gitignore`), so they can never be committed. `prisma db push` works |
| Seed | `prisma/seed.ts` and `seed.js` are 0 bytes; no `prisma.seed` config |
| Multi-tenancy | Schema-level `Tenant` + `tenantId` FKs on most models; **not enforced at runtime** (see defect register) |
| Auth | Frontend: mock login only. Backend: JWT + OAuth exist but login does not verify passwords |
| File storage | `S3Service` (upload/signed URL/delete); no controller endpoint, no Document row written |
| Queues | Bull `payroll` queue processor exists but nothing enqueues (dead code) |
| Email | SendGrid `EmailService`; no callers |
| Deployment | `backend/Dockerfile` (runs as root, no healthcheck), `docker-compose.yml` (default credentials, project name collides with other local projects named `backend`), no `.env.example` |
| Frontend base path | `vite.config.ts` sets build `base: '/__-portfolio/hrms/'`; Login uses absolute `/Meridian-HRMS-logo.png` (breaks under that base) |

## 3. Architecture assessment
- **Frontend is a self-contained demo.** No page fetches from the backend. Only `components/ui/ApiTest.tsx` uses `src/api/config.ts`, and that route exists only in the orphaned `src/routes.tsx`. (VERIFIED by static inspection.)
- **Backend is a skeleton.** Real persistence only in Auth and Users. Employees, Attendance, Leave, Payroll, Documents, Admin controllers return `[]`/zeros and have no guards; Notifications is empty.
- The two halves have never been integrated end-to-end. The commit "backend and frontend connectivity - done" added compiled `.js` files and a lockfile; it did not connect the UI to the API.

## 4. High-risk areas
1. Authentication/authorization and tenant isolation (see `DEFECT_RISK_REGISTER.md`, S-series).
2. Committed compiled `.js` beside `.ts` (55 files) that shadow the sources at runtime (VERIFIED: ts-node loaded stale `auth.controller.js` and crashed).
3. Schema that defeats multi-tenancy (global unique email/employeeId) and stores money as `Float`, bank data as plaintext.
4. No tests on either side, no audit trail, no migrations.
5. Payroll: only dead-code queue processor with a flat 20% tax; UAE gratuity/WPS helpers exist client-side (`src/utils/uaeGratuity.ts`, `wpsFile.ts`) and are not backend-validated.

## 5. Mock / placeholder inventory
Login (`authSlice.ts` `mockLoginApi`, 3 hardcoded users, tokens like `mock-jwt-token-for-admin`); every HRMS/Recruitment/Performance page (local arrays / `mocks/mockData.ts` 409 lines / `useState`); NotificationCenter (derived from mockData); AIAssistant (scripted messages, no model call); ResumeParser (`setTimeout` fake); Reports (exports mock arrays). Demo users are defined four times (`authSlice.ts`, `mocks/browser.ts`, `db.json`, `Login.tsx`) and there are two employee datasets (`MOCK_EMPLOYEES`, `mockData.employees`).

## 6. Dead / duplicate code
`src/routes.tsx`, `src/auth/index.tsx`, `src/hrms/index.tsx`, `src/performance/index.tsx` (older tab shells), `store/hooks.ts` (`AuthContext`/`useAuth` never provided), `ApiTest.tsx`, `App.css` residue, `postcss.config.cjs` + `postcss.config.js`, `public/-Meridian-HRMS-logo.png` duplicate, `backend/src/simple-server.js` (standalone Express server exposing users incl. password hashes, unauthenticated; not referenced by any script).

## 7. What this audit did NOT verify
- Backend HTTP behaviour: the backend cannot start in this environment without source changes (BUG-B03/B04), so login/register/tenant defects are **VERIFIED by code inspection only** and remain **REQUIRES RUNTIME VALIDATION**.
- Frontend behaviour in a browser (dev server not exercised; build and type-check only).
- Accessibility, performance and responsive behaviour.
