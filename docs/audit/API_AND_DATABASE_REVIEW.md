# API Inventory & Database Schema Review

## 1. Backend API inventory (global prefix `/api`; Swagger at `/api/docs`)
| Method & path | Guard | Behaviour | Class |
|---|---|---|---|
| POST `/auth/login` | none | Finds user by email+tenant, issues JWT, **no password check** | PARTIAL / insecure |
| POST `/auth/register` | none | Creates user (accepts `role`), issues JWT | PARTIAL / insecure |
| GET `/auth/google`, `/auth/google/callback`, `/auth/microsoft`, `/auth/microsoft/callback` | OAuth | Returns raw `req.user`; no redirect | PARTIAL |
| GET `/auth/profile` | JWT | Returns token user | VERIFIED (code) |
| POST/GET `/users` | JWT + Roles ADMIN,HR | create / list (list breaks: B06) | PARTIAL |
| GET `/users/:id` | JWT (any role) | not tenant-scoped | insecure |
| PATCH `/users/:id` | JWT + ADMIN,HR | can change role/isActive | insecure |
| DELETE `/users/:id` | JWT + ADMIN | not tenant-scoped | insecure |
| GET `/employees`, `/attendance`, `/leave`, `/documents` | none | return `[]` | BACKEND STUB |
| GET `/payroll/summary`, `/admin/stats` | none | hardcoded zeros | BACKEND STUB |
| (Notifications) | — | no routes | MISSING |
Standalone `src/simple-server.js` (Express, port 3000): unauthenticated `GET /api/users` (incl. hashes), `/api/employees`.

Contract observations: no response envelope, no pagination/filter/sort params, no exception filter, DTO validation only via global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) — good baseline. Frontend expects `/api/auth/login` → `{user, token}`, `/api/users`, `/api/employees` on port 3000 (`src/api/config.ts`); the real backend default PORT and shapes must be reconciled.

## 2. Database schema review (`backend/prisma/schema.prisma`, 337 lines, PostgreSQL)
Models: Tenant, User, Employee, Department, Attendance, Leave, Payslip, Document, Notification, PerformanceReview, Goal. Enums: Role(ADMIN,HR,MANAGER,EMPLOYEE), Gender, AttendanceStatus, LeaveType, LeaveStatus, PayslipStatus, DocumentType, NotificationType, ReviewStatus, GoalStatus.

| Topic | Finding |
|---|---|
| Tenancy | `tenantId` FK (Cascade) on User, Employee, Department, Attendance, Leave, Payslip, Document, Notification. **Missing** on PerformanceReview, Goal. Per-tenant `@@unique([email, tenantId])` (:55) is neutralised by global `email @unique` (:34); same for `employeeId` (:69), `googleId`, `microsoftId` |
| Relations | Employee self-relation (manager/subordinates); Notification sender/recipient → User; reviews reviewer/reviewee → Employee; `Leave.approvedById` plain string |
| Constraints | Department unique (name, tenantId); no Attendance unique (employeeId, date); no state-transition constraints |
| Indexes | none beyond uniques |
| Types | Money as `Float`; bank account plaintext string |
| Deletion | Cascade deletes tenant→all rows; no soft-delete/archive; no effective-dating |
| History/audit | none (no employment/compensation/config history, no audit log) |
| Migrations | none; `/prisma/migrations/` git-ignored → schema changes untracked. `db push` succeeded on a fresh DB (RT) |
| Seed | empty |
| Missing domains | Job/Candidate/Application, Shift/Roster, LeavePolicy/Balance, SalaryStructure/PayrollRun, Expense, Survey, Feedback, OneOnOne, Workflow, Role/Permission/Module registry, Subscription/Plan, AuditLog |

## 3. Migration risks for the roadmap
1. Introduce migrations by baselining the current schema (`prisma migrate diff` → initial migration) before any change; stop ignoring `prisma/migrations/`.
2. Replacing global uniques with composite (tenantId, …) uniques is non-destructive on an empty DB; on any populated DB it needs a duplicate check first.
3. Adding `tenantId` to PerformanceReview/Goal needs a backfill via `employee.tenantId`.
4. `Float`→`Decimal` for money needs a data-conversion step; do it before payroll data exists.
5. Replace `onDelete: Cascade` on payroll/document data with restrict + archival.
