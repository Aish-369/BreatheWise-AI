# PostgreSQL migration status

The current runtime still uses synchronous node:sqlite DatabaseSync. Render DATABASE_URL is not wired into the application. This branch is a safe migration workstream; do not deploy until PostgreSQL is the only production persistence backend and integration tests pass.

## Required gates

1. Add pg and lockfile updates.
2. Add versioned PostgreSQL migrations for every current entity and index.
3. Replace synchronous SQLite repositories with async PostgreSQL repositories.
4. Refactor routes, services, session middleware, seeding and tests to await database work.
5. Preserve household isolation, hashed session tokens, transactions, API contracts, and UTC timestamps.
6. Test empty-database migration, idempotency, CRUD, rollback, concurrency, session expiry/revocation, and cross-household access against PostgreSQL.
7. Run audit, formatting, lint, strict typecheck, full tests/coverage, production build, and Playwright.
8. Deploy only after all checks pass; verify persistence across a Render restart.

## Current code facts

- Entry point: server.ts; it calls synchronous getDb() and SQLite migrations.
- Connection: src/server/db/connection.ts.
- Repositories: households, locations, members, plans, routines, sessions, settings, snapshots.
- Six SQLite migrations exist under src/server/migrations/.
- Routes and services also use DatabaseSync and must be refactored.
- package.json does not include pg.

This is a migration checklist only, not proof of implementation or test completion. Keep the live deployment unchanged until all release gates pass.
