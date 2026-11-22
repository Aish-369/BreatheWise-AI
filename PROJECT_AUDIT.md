# BreatheWise AI — Repository & Release Audit

**Audit date:** 2026-11-22  
**Repository:** `Aish-369/BreatheWise-AI`  
**Production branch:** `main`  
**Consolidation branch:** `fix/free-production-readiness`  
**Pull request:** [#8](https://github.com/Aish-369/BreatheWise-AI/pull/8)

## Executive status

The supplied `breathewise-source.zip` was extracted and inspected. Its source files match the current `fix/free-production-readiness` snapshot by Git blob SHA for `package.json`, `server.ts`, `src/server/db.ts`, `src/server/app.ts`, `src/server/service.ts`, and `src/server/migrations.ts`. The archive does not include `.git`, so it is a source snapshot, not a full Git clone.

The application is **not yet production-ready with durable persistence**. The Express runtime still uses synchronous `node:sqlite` (`DatabaseSync`). The existing Supabase PostgreSQL schema is provisioned, but the application runtime is not connected to it. Do not point production traffic at PostgreSQL until the async repository refactor and integration tests are complete.

## Git and branch audit

The repository currently has seven branch refs: `main` plus six development/fix branches.

| Branch | Head commit | Related PR | Finding |
|---|---|---:|---|
| `main` | `abfb601b4b4750cca7820c4517b25b5cf88bffca` | — | Production branch; preserve |
| `fix/free-production-readiness` | `ceb60de3053e8fa719ed0416d3e3a006077e57fc` | #8 | Target consolidation/release branch; keep |
| `hardening/production-readiness` | `5be0a3440fd51366aeeea62ecb6eea7a36ca7c7c` | #1, #2 | Both PRs merged into `main`; stale branch ref |
| `fix/environmental-provider-reliability` | `22471919127c70d8cf5a735bf886f1f5d224121c` | #3 | PR merged into `main`; stale branch ref |
| `hardening/session-rate-limits` | `39d0f5d3dc1dfa8c33b08439512135db70be8986` | #4, #5 | PR #4 merged; duplicate PR #5 closed; stale branch ref |
| `fix/air-quality-page-reliability` | `79796e32601e5775a55ed860ed0ad92606b61e6f` | #6 | PR merged into `main`; stale branch ref |
| `fix/air-quality-data-fallbacks` | `1fea56444299c86e7496119276fb20ed751733fd` | #7 | PR merged into `main`; stale branch ref |

PRs #1, #2, #3, #4, #6 and #7 are merged. PR #5 duplicated the already-merged rate-limit change from PR #4 and has now been closed. PR #8 remains the only open development PR and targets `main` from `fix/free-production-readiness`.

The five stale branch refs are safe candidates for deletion because their corresponding PRs were merged. They have **not** been deleted in this audit: the connected GitHub actions available to this session support reading and updating refs but do not expose a branch-delete operation. Do not use force-push or delete `main` as a workaround.

## Code architecture findings

- Node.js + TypeScript + Express API with React/Vite frontend.
- `src/server/db.ts` uses `DatabaseSync` from `node:sqlite` and synchronous prepared-statement operations.
- `src/server/app.ts` receives a `DatabaseSync` instance; session middleware and household CRUD synchronously call database helpers.
- `server.ts` creates the SQLite database during startup and closes it during graceful shutdown.
- `src/server/migrations.ts` contains SQLite-specific migration logic and PRAGMA inspection.
- The current production API health route is `/api/health`; it reports the SQLite schema version, not PostgreSQL readiness.
- Existing rate limiting is in-memory and per process; it is not a distributed rate limiter.
- CPCB and OpenAQ integrations require server-side API keys. CAMS forecasts must remain distinct from measured station observations.

## Supabase audit

Project `batvqlnhpujyqyeeikmv`, PostgreSQL 17, Mumbai region.

- 15 application/public tables were inspected.
- RLS is enabled on all 15 tables.
- `schema_migrations` has 6 rows; Supabase migration history reports 3 applied migrations.
- `data_providers` and `data_licenses` each contain 3 reference rows.
- Household/session/member/routine/location/snapshot/forecast/plan/recommendation/evidence/scenario tables currently contain no user data.
- Security advisor reports `rls_enabled_no_policy` on all 15 tables (INFO). This is consistent with the documented deny-by-default model; do not add permissive anonymous policies to silence the notice.
- Performance advisor reports 17 unused-index notices (INFO); these are not grounds for deleting indexes before production workload evidence exists.

The intended integration needs server-only credentials, household-scoped parameterized queries, hashed session tokens, connection pooling, transactions, and asynchronous callers. No database password/connection URI was available to this task. No production schema or data was changed.

## Render deployment audit

- Service: `BreatheWise-AI`
- URL: https://breathewise-ai-6e2o.onrender.com
- Current deployment branch: `main`
- Current live commit: `abfb601b4b4750cca7820c4517b25b5cf88bffca`
- Current live deployment status: `live`
- Plan/region: Free / Singapore
- Build: `npm install --include=dev && npm run build`
- Start: `npm start`
- Health-check path: not configured in the service metadata

Render is still deploying `main`, not the release branch. No deployment was triggered from this audit. Live database persistence and a public health request were not verified.

## Verification evidence

- GitHub Actions CI run #113 for PR #8 head `ceb60de3053e8fa719ed0416d3e3a006077e57fc`: **success** (type check, tests, production build and configured dependency audit as defined by the workflow).
- Local runtime: Node `v22.16.0`, npm `10.9.2`.
- Local `npm ping` failed with `EAI_AGAIN` resolving `registry.npmjs.org`; the supplied archive has no `node_modules`. Local tests/build could not be re-run in this environment.
- The CI result applies to the PR head before this audit document is added. The new documentation-only commit must receive its own CI run before its checks can be marked passed.

## Required remaining work

1. Implement a complete asynchronous PostgreSQL repository and refactor every synchronous database caller in the server, services and tests.
2. Add PostgreSQL integration tests for household isolation, sessions, CRUD, transactions and persistence across restart.
3. Configure the server-only database connection securely in Render; never commit it or expose it through a `VITE_` variable.
4. Verify all API and browser flows against PostgreSQL before switching production traffic.
5. Verify CPCB/OpenAQ live connectivity only when valid credentials and upstream coverage are available; keep unavailable readings explicit.
6. Configure a production health-check path and verify live startup/database readiness.
7. Delete the five obsolete development branch refs after confirming merged PR history; keep `main` and `fix/free-production-readiness` only.
8. Re-run CI after all code and documentation changes, then prepare the final clean source archive.

## Safety decisions

- No production database migration or destructive SQL was executed.
- No RLS policies were weakened.
- No production secrets were requested, copied or committed.
- No fabricated air-quality measurements were introduced.
- PR #8 was not merged and Render was not switched to the unfinished branch.
