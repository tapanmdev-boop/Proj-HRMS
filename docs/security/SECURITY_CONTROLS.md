# Security Controls

Only controls that are implemented **and** covered by a test are listed as implemented. Nothing here is a compliance claim; jurisdiction-specific legal review is separate.

| Control | Implementation | Verified by |
|---|---|---|
| Password storage | bcrypt, cost 12; password max 72 (bcrypt limit) enforced | e2e "stores passwords as bcrypt hashes" |
| Credential checking | Login compares the hash; unknown user/org/password return the same 401 message; a dummy hash is compared for unknown users to reduce timing differences | e2e "same 401 message" |
| Brute-force limits | Login/sign-up/refresh/logout limited (`AUTH_THROTTLE_LIMIT`, default 10/min/client); global limit for other routes (`THROTTLE_LIMIT`) | e2e "returns 429" |
| Authentication on every route | Global JWT guard; only routes marked `@Public()` are open (login, sign-up, refresh, logout, OAuth) | e2e "GET … without a token returns 401" for every module |
| Role authorization | Global roles guard + `@Roles()`; service-level rules (only ADMIN manages admins; no self role change/deactivate/delete) | e2e privilege-escalation tests |
| Tenant isolation | All queries scoped by the caller's tenant; cross-tenant IDs return 404; client-supplied tenant is ignored | e2e tenant-isolation tests (users, employees, departments, tenant settings) |
| Token trust | Token carries identity only; role, tenant, active flags re-read from the DB each request, so demotion/deactivation/deletion/tenant suspension apply immediately | e2e "token lifetime is bound to the database" |
| Sessions | Short-lived access token (default 900 s) + rotating refresh token; only a SHA-256 hash stored; reuse of a rotated token revokes the whole family; logout revokes | e2e refresh-token tests |
| Field-level privacy | Pay, bank, identity and contact data returned only to Admin/HR and the employee themself | e2e + live contract |
| Input validation | Global `ValidationPipe` (whitelist, forbid unknown fields, transform); DTO constraints; UUID params; exact-decimal money; identifier map limits | e2e validation tests |
| Audit logging | Auth, tenant, user, employee, department events; secrets, tokens, salary, bank fields redacted; failures never break the operation | e2e audit tests |
| Data retention | Payslips and documents cannot be cascade-deleted with an employee; termination keeps history | e2e financial-record tests |
| Transport/headers | Helmet; CORS restricted to `CORS_ORIGINS` (empty = none) | live CORS check (allowed origin permitted, others get no allow header) |
| Configuration | Startup fails without a strong `JWT_SECRET` (≥32 chars) and `DATABASE_URL`; no default credentials in code; seed refuses production and takes secrets from the environment | seed run (missing env, production guard) |
| Surface reduction | Swagger disabled in production; Prisma query logging off by default; `simple-server.js` (unauthenticated user dump) removed; sign-up disabled by default in production (`ALLOW_SIGNUP`) | code review + e2e |
| Frontend | Access token kept in memory; single-flight refresh; CSV export neutralizes formula injection; no credentials shown in the UI | `http.test.ts`, `employeeForm.test.ts` |

## Known gaps (not implemented)
- Refresh token in `localStorage` (XSS-exposed). Move to an httpOnly, SameSite cookie when API and app share a site.
- No MFA, password reset, email verification, account lockout beyond rate limiting, or session listing.
- No malware scanning or content validation because file upload is not built yet.
- No field-level encryption at rest for bank/identity data (Postgres and disk encryption are deployment concerns).
- No CSRF token (bearer-token API, no cookie auth yet); revisit with cookie sessions.
- No dependency-vulnerability gate in CI (no CI exists). `npm audit` reports issues in transitive dependencies (e.g. multer 1.x, aws-sdk v2 in maintenance mode) that need a planned upgrade.
- Rate limiting is per process (in-memory); use a shared store behind multiple instances.
- Audit log is not tamper-evident and has no retention/export policy.
