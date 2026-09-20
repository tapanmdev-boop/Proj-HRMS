# Baseline Status

Date: 2026-09-20. Host: Windows 10, Node 22.19.0, npm 11.6.1, Docker 29.7.2, `psql` not installed. No tracked source file was modified by the baseline (see "Side effects").

## Commands and results
| # | Command (dir) | Result | Classification |
|---|---|---|---|
| 1 | `npx tsc -b` (root) | PASS, 0 errors | — |
| 2 | `npm run lint` (root) | FAIL: 90 problems = 86 errors + 4 warnings. By rule: `no-explicit-any` 68, `no-unused-vars` 10, `ban-ts-comment` 4, `no-require-imports` 2, `no-unsafe-function-type` 2, `react-refresh/only-export-components` 2, parse/other 2 | Pre-existing |
| 3 | `npx vite build --outDir <temp>` (root) | PASS in 13.8s; largest chunk `index` 249.8 kB (81 kB gzip) | — |
| 4 | `npm ci` (backend) | FAIL: lockfile out of sync with `package.json` (ajv 8.12.0 vs 6.15.0, json-schema-traverse, fast-uri missing) | Pre-existing defect |
| 5 | `npm install --no-package-lock` (backend) | PASS, 975 packages; deprecation warnings (aws-sdk v2, multer 1.x, eslint 8, glob 10, tar 6, superagent 8) | Workaround; lockfile untouched |
| 6 | `npx tsc --noEmit` (backend) | FAIL: 1 error, `src/users/users.service.ts:47` TS2345 (`select` not accepted by `withTenant().user.findMany` type) | Pre-existing |
| 7 | `npx nest build` (backend) | FAIL: TS1219/TS1241/TS1270 decorator errors, cause: `tsconfig.build.json` is an empty file (no `experimentalDecorators`) | Pre-existing |
| 8 | `npx prisma validate` / `prisma generate` | PASS (Prisma 5.22) | — |
| 9 | `npx prisma db push` against isolated Postgres 15 on 127.0.0.1:55432 | PASS, schema in sync | — |
| 10 | `npx ts-node --transpile-only src/main.ts` | FAIL: loads committed stale `src/auth/auth.controller.js` (standard-decorator output) → `TypeError` in `@nestjs/swagger` helpers | Pre-existing (committed build artifacts) |
| 11 | `npx ts-node --transpile-only --preferTsExts src/main.ts` | FAIL: `Nest can't resolve dependencies of the BullExplorer` — `@nestjs/bull` is imported by `app.module.ts` but not declared in `backend/package.json`; it resolves to the root's v11 against backend Nest 10 | Pre-existing (missing/mismatched dependency) |
| 12 | Backend HTTP probes (`/api/auth/*`, `/api/users`, `/api/employees`) | **NOT RUN** — backend cannot start without source changes. Requests to `localhost:3000` reach an unrelated local service ("Untrusted request origin") and are discarded as evidence | REQUIRES RUNTIME VALIDATION |
| 13 | Vite dev server + browser walk-through | **NOT RUN** | REQUIRES RUNTIME VALIDATION |

**Existing test suites:** none exist on either side, so no test baseline can be recorded.

## Environment limitations
- Port 3000 is occupied by an unrelated process; native Windows PostgreSQL occupies 5432. Baseline DB uses port 55432 and backend probes would use 3010.
- No `.env.example`; a throwaway git-ignored `backend/.env` was created for the baseline (dev values only).
- Root `node_modules` shadows missing backend packages, so backend results obtained before installing backend deps (an earlier interim `tsc`/`nest build` run) are **invalid** and superseded by rows 6–7.

## Side effects of the baseline (disclosure)
1. `nest build` (row 7) emitted `.js` over 55 tracked backend files; reverted with `git checkout -- backend`. `git status` outside the staged nested copy is clean.
2. `docker compose up -d postgres redis` from `backend/` shared a compose project name (`backend`) with another local project and **replaced its containers `aerovantis-postgres` and `aerovantis-redis`**. Their data volumes (`backend_postgres-data`, `backend_redis-data`) were verified intact; the two volumes I created (`backend_postgres_data`, `backend_redis_data`) were removed. The other project can be restored by running its own compose file again. Compose from `backend/` must not be run again until the project name is set explicitly.
3. Left on the machine: container `hrms-baseline-pg` (port 55432), `backend/.env` (ignored), `backend/node_modules` (ignored).
