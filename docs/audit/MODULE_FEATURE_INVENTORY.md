# Module & Feature Inventory

Frontend routes from `src/App.tsx` (all under `ProtectedRoute` + `MainLayout`, which checks only that a token exists). Backend routes are prefixed `/api`. **No frontend module calls the backend**, so "API integration" is *disconnected* for every row. Roles column = what the frontend nav (`components/layout/navigation.ts`) / page code show; **no backend enforcement exists** except Users (ADMIN/HR/MANAGER-less RolesGuard). Tests: none for any module.

Legend for status: UI ONLY / MOCK = frontend renders local data; BACKEND STUB = controller returns empty/zero data unauthenticated; MISSING = no implementation found.

| Module | Frontend route | Backend endpoints | DB entities | Status (evidence class) | Key gaps / defects | Recommended action |
|---|---|---|---|---|---|---|
| Authentication | `/auth/login` | `POST /auth/login`, `/register`, `/google`, `/microsoft` (+callbacks), `GET /auth/profile` | User, Tenant | Frontend MOCK; backend PARTIALLY IMPLEMENTED but **insecure** (S01–S03, S08, S09) | login skips password; register role; no refresh/logout; session restore bug F02 | Fix, then integrate |
| Authorization / RBAC | route guards, nav `roles` | `RolesGuard` on Users only | Role enum (4 roles) | PARTIALLY IMPLEMENTED (UI nav-hiding only; backend guard on 1 controller) | No permission model, no route-level RBAC | Build permission layer (Phase 9) |
| Super Admin | — (none) | `GET /admin/stats` returns zeros, unguarded | Tenant | MISSING (backend stub) | No tenant/module/role mgmt | Build (Phase 9) |
| Organization / tenant mgmt | — | none | Tenant | MISSING (schema only) | Tenant not enforced at runtime (S03) | Fix isolation first |
| Employees | `/hrms/employees`, `/hrms/profile` | `GET /employees` → `[]` | Employee, User | Frontend MOCK (`MOCK_EMPLOYEES`); backend stub | no CRUD API, no history, no bulk import | Complete end-to-end first (Phase 1) |
| Departments / org structure | `/hrms/org-chart` | none | Department (unique name+tenant) | MOCK (hardcoded tree); MISSING API | no reporting-line API | Phase 1 |
| Attendance | `/hrms/attendance` | `GET /attendance` → `[]` | Attendance | MOCK; backend stub | no unique (employee,date), no shifts/regularization | Phase 2 |
| Leave | `/hrms/leaves` | `GET /leave` → `[]` | Leave (`approvedById` unrelated) | MOCK; backend stub | no policies/balances/accrual/workflow | Phase 2 |
| Payroll | `/hrms/payroll` | `GET /payroll/summary` (zeros); dead Bull `PayrollProcessor` | Payslip | MOCK + client-side UAE gratuity/WPS utils; backend stub | Float money, flat 20% tax, no runs/approval | Phase 3 (jurisdiction-aware design) |
| Employee documents | `/hrms/documents` | `GET /documents` → `[]`; `S3Service` unused | Document | MOCK; BACKEND ONLY (S3 helper) | no upload endpoint/DB row, no file validation | Phase 1 |
| Notifications | `NotificationCenter` (bell) | none (controller/processor empty; `EmailService` unused) | Notification | MOCK (derived from mockData) | no delivery | Cross-cutting |
| Recruitment | `/recruitment/*` (job-postings, candidates, interviews, resume-parser, analytics) | none | none (no Job/Candidate models) | MOCK; ResumeParser fake (`setTimeout`) | entire domain missing in DB | Phase 4 |
| Onboarding / offboarding | `/hrms/onboarding`, `/hrms/offboarding` | none | none | MOCK | no task templates/ownership | Phase 1 |
| Performance reviews | `/performance/reviews` | none | PerformanceReview (no tenantId) | MOCK; schema exists | no API, no tenant scope | Phase 5 |
| Goals / OKRs | `/performance/goals` | none | Goal (no tenantId) | MOCK; schema exists | no cascade/alignment | Phase 5 |
| Feedback | `/performance/feedback` | none | none | MOCK | | Phase 5 |
| 1:1 meetings | `/performance/1on1` | none | none | MOCK | | Phase 5 |
| Engagement surveys | `/performance/surveys` | none | none | MOCK | anonymity rules absent | Phase 6 |
| Performance analytics | `/performance/analytics` | none | — | MOCK | | Phase 8 |
| Expenses | `/hrms/expenses` | none | none | MOCK | no policy/approval/receipts | Phase 7 |
| Reports & analytics | `/hrms/reports`, `/recruitment/analytics` | `GET /admin/stats` zeros | — | MOCK (exports mock arrays) | no real aggregation | Phase 8 |
| Subscription & billing | `/pricing`, `/hrms/settings/plans` | none | none | UI ONLY (static) | no plans/entitlements | Phase 9 |
| Settings / configuration | `/hrms/settings/plans` only | none | — | UI ONLY | no tenant settings | Phase 9 |
| AI assistant | header widget | none | — | MOCK (scripted) | no model, no permission-aware retrieval | Phase 8 |
| Learning & development, benefits, helpdesk, workflow engine, integrations, audit log | — | none | none | MISSING | | Phases 5–9 |

## Route-level facts
- Public: `/auth/login`, `/pricing`, `/unauthorized`. `/` and `*` redirect to `/auth/login`.
- Sub-routes: `/hrms` {index, employees, leaves, payroll, attendance, expenses, documents, onboarding, offboarding, reports, profile, org-chart, settings/plans}; `/recruitment` {index, job-postings, candidates, interviews, resume-parser, analytics}; `/performance` {index, reviews, goals, feedback, 1on1, surveys, analytics}.
- Pages using role checks in-page: Employees, Attendance, Expenses, Leave, Payroll, Profile; all depend on `user`, which is null after reload (F02).
