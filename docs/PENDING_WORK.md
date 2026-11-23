# BreatheWise AI — Master Pending Work Tracker

**Last updated:** 2026-11-23  
**Rule:** IMPLEMENTED is not VERIFIED. Only passing acceptance checks make a task VERIFIED.

| ID | Priority | Area | Task | Status | Acceptance evidence |
|---|---|---|---|---|---|
| BW-001 | P0 | Persistence | Implement asynchronous PostgreSQL repositories and connection pooling; refactor every SQLite caller safely. | NOT_STARTED | All production routes/services/repositories use the intended DB and integration tests pass. |
| BW-002 | P0 | Database | Create/version PostgreSQL migrations with schema parity, constraints, indexes and transactions. | NOT_STARTED | Fresh-database migration, repeatability and rollback checks pass. |
| BW-003 | P0 | Security | Prove household isolation for every PostgreSQL read/write and session operation. | NOT_STARTED | Cross-session tests prove no household can access another household's data. |
| BW-004 | P0 | Hosting | Configure server-only database credentials and verify persistence across restart/redeploy. | BLOCKED | Requires BW-001–003 and authorized hosting configuration; no secrets in code/client. |
| BW-005 | P1 | QA | Install dependencies and run format, lint, typecheck, unit tests, coverage and build. | BLOCKED | Commands execute with recorded exit codes and results. |
| BW-006 | P1 | E2E | Run Playwright/Chromium core journeys and expand missing user-flow coverage. | NOT_STARTED | Browser tests pass with trace/screenshot evidence on failure. |
| BW-007 | P1 | Documentation | Reconcile test-count and coverage statements across README and testing docs. | IN_PROGRESS | Counts/coverage match a dated successful CI run. |
| BW-008 | P1 | Security | Complete auth/session, CSRF, rate-limit, RLS, dependency and data-isolation review. | NOT_STARTED | Findings fixed or explicitly accepted; regression tests pass. |
| BW-009 | P1 | Operations | Verify hosting health-check configuration and database readiness behavior. | NOT_STARTED | Host probes a verified unauthenticated readiness endpoint. |
| BW-010 | P1 | Architecture | Preserve SQLite only as an explicit local/test adapter if needed; prevent production fallback to ephemeral storage. | NOT_STARTED | Environment/database selection is explicit and tested. |
| BW-011 | P2 | Performance | Evaluate in-memory rate-limiter behavior and multi-instance requirements. | NOT_STARTED | Single-instance limitation documented or shared store implemented and tested. |
| BW-012 | P2 | Frontend | Verify responsive layouts, keyboard access, accessibility and core user journeys. | NOT_STARTED | Automated and browser/manual checks recorded. |
| BW-013 | P2 | Data/AI | Verify provider connectivity, provenance, forecast-vs-observation labeling and outage behavior. | NOT_STARTED | Tests/live checks prove no fabricated readings and unavailable data stays explicit. |
| BW-014 | P2 | Documentation | Refresh architecture, database, security, testing, deployment and release docs after implementation. | NOT_STARTED | Documentation matches the verified final code and deployment. |
| BW-015 | P2 | Git/release | Reconcile quality branches and prepare a clean reviewed release PR. | IN_PROGRESS | Unique branch work is inspected and preserved; no blind deletion or merge. |

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
