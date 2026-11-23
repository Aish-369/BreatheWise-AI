# BreatheWise AI — Master Pending Work Tracker

**Last updated:** 2026-11-23

**Rule:** IMPLEMENTED is not VERIFIED. Only passing acceptance checks make a task VERIFIED.

## P0 — Release blockers

- **BW-001 — Persistence — NOT_STARTED:** Implement asynchronous PostgreSQL repositories and connection pooling; refactor every SQLite caller safely. Acceptance: all production routes, services and repositories use the intended database, and integration tests pass.
- **BW-002 — Database — NOT_STARTED:** Create and version PostgreSQL migrations with schema parity, constraints, indexes and transactions. Acceptance: fresh-database migration, repeatability and rollback checks pass.
- **BW-003 — Security — NOT_STARTED:** Prove household isolation for every PostgreSQL read/write and session operation. Acceptance: cross-session tests prove no household can access another household's data.
- **BW-004 — Hosting — BLOCKED:** Configure server-only database credentials and verify persistence across restart/redeploy. Acceptance: BW-001–003 are complete and hosting configuration is authorized; no secrets appear in code or client bundles.

## P1 — Quality and security

- **BW-005 — QA — BLOCKED:** Install dependencies and run format, lint, typecheck, unit tests, coverage and build. Acceptance: commands execute with recorded exit codes and results.
- **BW-006 — E2E — NOT_STARTED:** Run Playwright/Chromium core journeys and expand missing user-flow coverage. Acceptance: browser tests pass with trace/screenshot evidence on failure.
- **BW-007 — Documentation — IN_PROGRESS:** Reconcile test-count and coverage statements across README and testing docs. Acceptance: counts and coverage match a dated successful CI run.
- **BW-008 — Security — NOT_STARTED:** Complete auth/session, CSRF, rate-limit, RLS, dependency and data-isolation review. Acceptance: findings are fixed or explicitly accepted, with regression tests.
- **BW-009 — Operations — NOT_STARTED:** Verify hosting health-check configuration and database readiness behavior. Acceptance: host probes a verified unauthenticated readiness endpoint.
- **BW-010 — Architecture — NOT_STARTED:** Preserve SQLite only as an explicit local/test adapter if needed; prevent production fallback to ephemeral storage. Acceptance: environment/database selection is explicit and tested.

## P2 — Product maturity

- **BW-011 — Performance — NOT_STARTED:** Evaluate in-memory rate-limiter behavior and multi-instance requirements. Acceptance: single-instance limitation is documented or a shared store is implemented and tested.
- **BW-012 — Frontend — NOT_STARTED:** Verify responsive layouts, keyboard access, accessibility and core user journeys. Acceptance: automated and browser/manual checks are recorded.
- **BW-013 — Data/AI — NOT_STARTED:** Verify provider connectivity, provenance, forecast-vs-observation labeling and outage behavior. Acceptance: tests/live checks prove no fabricated readings and unavailable data stays explicit.
- **BW-014 — Documentation — NOT_STARTED:** Refresh architecture, database, security, testing, deployment and release docs after implementation. Acceptance: documentation matches verified final code and deployment.
- **BW-015 — Git/release — IN_PROGRESS:** Reconcile quality branches and prepare a clean reviewed release PR. Acceptance: unique branch work is inspected and preserved; no blind deletion or merge.

## Verified corrections

- Current tsconfig.json already enables strict TypeScript checks; the older contrary audit statement is stale.
- The inspected source snapshot contains 31 test files. README wording has been corrected from 30 to 31.
- The current Express runtime still uses synchronous SQLite DatabaseSync; PostgreSQL is not yet the production runtime.

## Release safety rules

- Do not switch production traffic to PostgreSQL until BW-001, BW-002 and BW-003 are implemented and verified.
- Do not run destructive production migrations or modify live data during source-only work.
- Do not weaken RLS or expose service-role credentials.
- Keep main and the current live deployment unchanged until a reviewed release passes all critical gates.
- Update this tracker after each implementation and test run.
