# BreatheWise AI — Execution Baseline

- **Execution date:** 2026-11-23
- **Repository:** Aish-369/BreatheWise-AI
- **Verified default branch:** main
- **Verified main commit:** 24bfd52fdbdce314fb42e5f3656140fc5b4a2f7c
- **Current migration workstream:** feat/postgres-persistence
- **Migration PR:** #15 (open; documentation/checklist only)

## GitHub state

The repository is accessible and the connected GitHub account has push/admin permissions. The source ZIP used for local inspection does not contain Git metadata, so local branch history cannot be inspected from that extracted folder. GitHub API inspection confirms the default branch and remote refs.

Remote refs observed:

- main — 24bfd52fdbdce314fb42e5f3656140fc5b4a2f7c
- feat/postgres-persistence — 5845edcd260edd7e2d418c5fe14cfbec4499c535
- quality/phase-1b-browser-e2e — 6c0efe3b3620ad63cd4e9eada3c48fe269f944a3
- quality/phase-2-hardening — cb3a463849396ed2b893e48929e1b877ffe88ea7
- quality/score-optimization-phase0 — 4f35f5ffaf98e976535270c067e732bad50c982e
- quality/strict-typescript-trial — c2a856d019f28480d525d93b886db6803d8cf0f6
- quality/testing-coverage-audit — e219b7e11b0f05440b6311390e63836d67bd4afc
- quality/97-score-final-hardening — 644a285d1067a61a7b63a14104af29f60a8f82b0

PRs #9–#14 are recorded as merged. PR #15 is open and targets main. Old branch refs must not be deleted until their unique commits and merged code are reconciled.

## Runtime and package baseline

- Node.js: v22.16.0
- npm: 10.9.2
- package-lock.json and bun.lock are present.
- The extracted source snapshot has no installed Vitest binary.
- package.json defines lint, typecheck, format:check, test, test:coverage, build, dev and start scripts.
- PostgreSQL driver pg is absent from package.json.
- Current tsconfig.json has strict: true, noImplicitAny: true and strictNullChecks: true. Older audit wording that claims these options are absent is stale for this source snapshot.

## Application architecture

- React + TypeScript + Vite frontend.
- Express 4 server.
- Runtime database is Node's synchronous node:sqlite DatabaseSync.
- Repositories and SQLite migrations are under src/server/db/ and src/server/migrations/.
- Route factories, session middleware and services pass DatabaseSync and use synchronous repository functions.
- /healthz is an unauthenticated database readiness probe; /api/health is a separate API endpoint.
- Rate limiting uses an in-process Map and is not shared across instances.
- Local maintenance routes explicitly return 403 in production.

## Test inventory and documentation

- The source snapshot contains 31 files under tests/ and one Playwright E2E file.
- Existing CI documentation reports 151 Vitest tests and 71.33% statement coverage; these are historical CI figures and were not rerun in this local environment.
- README's test-file count has been aligned to 31 to match the source inventory and docs/TESTING.md.

## Database and deployment

- docs/SUPABASE_POSTGRES_INTEGRATION.md says the Supabase PostgreSQL schema is provisioned but Express is not connected to it.
- Source confirms SQLite remains the active runtime.
- No production migration, Render configuration change, production data operation or deployment was performed.
- No database credential was exposed or copied.

## Verification status

- [x] Remote repository/default branch/current main SHA checked.
- [x] Remote branch refs and PR #15 checked.
- [x] Package scripts/dependencies inspected.
- [x] TypeScript strict options inspected.
- [x] Server, routes, session middleware, health probe, SQLite connection and rate limiter inspected.
- [x] Test file inventory checked.
- [ ] Dependency install and local lint/typecheck/tests/coverage/build.
- [ ] PostgreSQL implementation and integration tests.
- [ ] Live hosting health/persistence verification.

## Environment limitation

The extracted source snapshot has no installed dependency tree. Project-level lint, TypeScript, Vitest, Playwright and Vite checks cannot be reported as passed until dependencies are installed and commands are executed.
