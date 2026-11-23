# BreatheWise AI — Execution Audit (2026-11-23)

## Result

The uploaded archive is source commit `24bfd52fdbdce314fb42e5f3656140fc5b4a2f7c`. This audit does not certify a PostgreSQL-integrated release. The application code in this archive still uses Node's synchronous `node:sqlite` `DatabaseSync` implementation.

## Verified blockers

- `package.json` has no PostgreSQL client dependency (`pg` is absent).
- `src/server/db/connection.ts` opens a local SQLite database, enables SQLite pragmas, and runs SQLite migrations.
- All repository modules under `src/server/db/` accept `DatabaseSync` and issue synchronous `.prepare().get()`, `.all()`, `.run()`, and `.exec()` calls.
- Express route factories and `src/server/service.ts` pass the synchronous database object through request handlers and service operations.
- `server.ts` opens SQLite synchronously and calls `seedDemoHouseholdIfEmpty` before creating the Express app.
- The existing SQLite migrations are not PostgreSQL migrations and cannot be executed by PostgreSQL unchanged.

## Supabase state checked

Project `batvqlnhpujyqyeeikmv` is `ACTIVE_HEALTHY` in `ap-south-1`, running PostgreSQL 17. The schema contains the application tables and the three migration records visible to the Supabase migration service. Household-scoped tables currently have zero rows; provider and license reference tables contain seed rows.

RLS is enabled on the tables. The Supabase security advisor reports 15 `rls_enabled_no_policy` informational findings. This is deny-by-default. Do not add broad public policies. If the Express server connects using a private server-side database credential that bypasses RLS, enforce household ownership in every server query and never expose that credential to the browser.

## Verification attempted in this environment

- `npm ci --ignore-scripts --no-audit --no-fund` did not complete before the execution timeout.
- `npm install --package-lock-only --ignore-scripts --offline pg@^8.16.3` failed because the package metadata is not present in the local npm cache and registry access is unavailable in this execution environment.
- `npm test -- --reporter=dot` could not start because `vitest` was not installed (`sh: vitest: not found`).

Therefore lint, typecheck, tests, build, and Playwright are **not verified** in this environment. No green-check claim should be made.

## Required implementation sequence

1. Add a PostgreSQL client and regenerate the npm lockfile in a network-enabled environment.
2. Introduce a typed async database/repository contract and a PostgreSQL implementation with parameterized queries and explicit transaction support.
3. Convert every repository method and every caller in routes, middleware, services, seeding, and health checks to async/await. Preserve SQLite only as an explicitly selected local/test adapter if it remains supported.
4. Apply versioned PostgreSQL migrations for all entities, constraints, indexes, JSONB fields, and timestamps. Verify schema parity against the existing Supabase project before applying changes.
5. Add integration tests against a disposable PostgreSQL database for migrations, CRUD, rollback, concurrent requests, session token hashing/expiry, household isolation, and restart persistence.
6. Run `npm ci`, lint, format check, strict typecheck, complete Vitest suite with coverage, production build, and Playwright journeys.
7. Deploy only from a reviewed PR after all checks pass. Keep the current `main` and live Render service unchanged until then.

## Release gate

This archive is **not ready to switch to PostgreSQL or deploy as a PostgreSQL-backed release**. A configured `DATABASE_URL` does not change the current SQLite implementation. The 97+ score remains a target, not a measured result.
