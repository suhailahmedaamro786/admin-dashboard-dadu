# Dadu Business Insights — Admin Dashboard

Independent admin application for the existing Dadu Business Insights survey.

## Scope

This repository contains only the administrator UI, protected admin APIs, analytics, exports, PDF generation, database access, shared survey dimension constants, and security middleware required by the Admin Dashboard.

The public survey application remains in `Dadu-Business-Insights`.

## Database

This application reads the same existing PostgreSQL database used by the public survey. It does not create, migrate, reset, seed, or delete database records.

No Supabase schema is included because the admin app does not need to run schema migrations.

## Required configuration

Copy `.env.example` to your deployment environment. Never commit real secrets.

Server-only:
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_EMAIL`
- `DATABASE_URL` or `POSTGRES_URL`, or the `SQL_*` connection variables

Client-safe:
- `VITE_PUBLIC_SURVEY_URL`

`ADMIN_SESSION_SECRET` must be at least 32 characters.

## Local verification

```bash
npm install
npm run typecheck
npm run build
npm test
```

The database is read-only from the admin application. A real database connectivity check requires the existing database credentials to be supplied in the runtime environment; no credentials belong in Git.
