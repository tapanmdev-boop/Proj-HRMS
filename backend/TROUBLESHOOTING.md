# Backend setup and troubleshooting

## First run
```bash
cd backend
cp .env.example .env            # then set DATABASE_URL and JWT_SECRET (>= 32 chars)
docker compose up -d postgres redis   # uses project name "hrms"; ports come from .env
npm install
npx prisma migrate deploy
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='at-least-12-chars' npm run prisma:seed   # optional, dev only
npm run start:dev
```
API: `http://localhost:3001/api` · Swagger (non-production): `/api/docs`.

## Tests
```bash
npm run test:e2e        # needs Postgres + Redis from .env; writes to DATABASE_URL, so use a disposable database
```

## Common problems
| Symptom | Cause / fix |
|---|---|
| App exits at start with "JWT_SECRET must be at least 32 characters" | Set a longer secret in `.env` (`openssl rand -base64 48`) |
| `P1000 Authentication failed` | Another Postgres already uses the port (e.g. a local install on 5432). Set `POSTGRES_PORT` and the port in `DATABASE_URL` |
| `Port 3001 already in use` | Change `PORT` and `VITE_API_URL` in the frontend `.env.local` |
| `npm ci` says the lockfile is out of sync | Run `npm install` and commit the updated `package-lock.json` |
| Sign-up returns 403 | `ALLOW_SIGNUP=false` (the default in production). Create the first organization with the seed script instead |
| Browser requests blocked by CORS | Add the frontend origin to `CORS_ORIGINS` (comma separated) |
| Login says "Invalid email or password" for a valid user | The organization slug is wrong or the organization is inactive; the message is deliberately identical |
| `docker compose` replaced another project's containers | Compose projects are keyed by folder name. This file sets `name: hrms`; do not run older copies of it |
