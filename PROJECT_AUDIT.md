# BreatheWise AI — Repository & Release Audit

**Audit date:** 2026-11-22  
**Repository:** `Aish-369/BreatheWise-AI`  
**Production branch:** `main`  
**Consolidation branch:** `fix/free-production-readiness`  
**Pull request:** [#8](https://github.com/Aish-369/BreatheWise-AI/pull/8)

## Executive status

The supplied `breathewise-source.zip` was extracted and inspected. Its source files match the PR branch source for the main server/database files. The archive does not include `.git`, so it is a source snapshot, not a full Git clone.

The application is **not yet production-ready with durable persistence**. The Express runtime still uses synchronous `node:sqlite` (`DatabaseSync`). The existing Supabase PostgreSQL schema is provisioned, but the application runtime is not connected to it. Do not point production traffic at PostgreSQL until the async repository refactor and integration tests are complete.

## Git branch inventory and consolidation

The repository was initially found with seven refs: `main` plus six development/fix branches.

| Branch | Original head commit | Related PR | Consolidation result |
|---|---|---:|---|
| `main` | `abfb601b4b4750cca7820c4517b25b5cf88bffca` | — | Production branch; preserved |
| `fix/free-production-readiness` | `41cc0b8d57db2259334394777668adafea9b4a37` | #8 | Final consolidation branch |
| `hardening/production-readiness` | `5be0a3440fd51366aeeea62ecb6eea7a36ca7c7c` | #1, #2 | Branch head included as an additional parent; PR #1 head is its ancestor |
| `fix/environmental-provider-reliability` | `22471919127c70d8cf5a735bf886f1f5d224121c` | #3 | Branch head included as an additional parent |
| `hardening/session-rate-limits` | `39d0f5d3dc1dfa8c33b08439512135db70be8986` | #4, #5 | Branch head included as an additional parent; duplicate PR #5 closed |
| `fix/air-quality-page-reliability` | `79796e32601e5775a55ed860ed0ad92606b61e6f` | #6 | Branch head included as an additional parent |
| `fix/air-quality-data-fallbacks` | `1fea56444299c86e7496119276fb20ed751733fd` | #7 | PR #7 head is the current `main` commit and is already in target ancestry |

### Evidence that merged work is included

PRs #1, #2, #3, #4, #6 and #7 are merged. Their merge commits were each verified as ancestors of current `main`. PR #1's branch head is an ancestor of the PR #2 branch head. PR #5 duplicated the already-merged rate-limit change from PR #4 and is closed. PR #8 remains the only open development PR and targets `main`.

The target branch was based on the current `main` commit, so the final source tree already contains the changes merged through PRs #1–#7. To preserve the original development commit histories as well, a consolidation commit was created with the exact existing target tree and the four non-ancestor development branch heads as additional parents. No source files were overwritten or reverted by this graph-consolidation commit.

- Consolidation commit: `2a21e3fba8188d738618e86c47d360c12effbdba`
- Parent 1: previous target `41cc0b8d57db2259334394777668adafea9b4a37`
- Additional parents: `5be0a3440fd51366aeeea62ecb6eea7a36ca7c7c`, `22471919127c70d8cf5a735bf886f1f5d224121c`, `39d0f5d3dc1dfa8c33b08439512135db70be8986`, `79796e32601e5775a55ed860ed0ad92606b61e6f`
- The `fix/air-quality-data-fallbacks` head `1fea56444299c86e7496119276fb20ed751733fd` equals current `main`, so it is already an ancestor.
- The update was a normal fast-forward ref update with an expected-old-SHA check; no force push was used.

**Important cleanup limitation:** the five obsolete remote branch refs still exist. The connected GitHub actions available here do not expose a branch-delete operation. They are safe cleanup candidates because their useful work is now in `main` and/or preserved in the target commit graph, but they have not been deleted. Delete only those five old refs after re-fetching and verifying their SHAs. Preserve `main` and `fix/free-production-readiness`.

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

- GitHub Actions run #113 for the previous PR #8 head succeeded.
- GitHub Actions run #115 for the audit documentation commit succeeded.
- The branch-consolidation commit itself is a history-only merge commit with the same tree as the already-tested audit commit; a new workflow run should still be checked for the final head.
- Local runtime: Node `v22.16.0`, npm `10.9.2`.
- Local `npm ping` failed with `EAI_AGAIN` resolving `registry.npmjs.org`; the supplied archive has no `node_modules`. Local tests/build could not be re-run in this environment.

## Required remaining work

1. Implement a complete asynchronous PostgreSQL repository and refactor every synchronous database caller in the server, services and tests.
2. Add PostgreSQL integration tests for household isolation, sessions, CRUD, transactions and persistence across restart.
3. Configure the server-only database connection securely in Render; never commit it or expose it through a `VITE_` variable.
4. Verify all API and browser flows against PostgreSQL before switching production traffic.
5. Verify CPCB/OpenAQ live connectivity only when valid credentials and upstream coverage are available; keep unavailable readings explicit.
6. Configure a production health-check path and verify live startup/database readiness.
7. Delete the five obsolete development branch refs after re-fetching and confirming their SHAs.
8. Re-run CI after all code and documentation changes, then prepare the final clean source archive.

## Safety decisions

- No production database migration or destructive SQL was executed.
- No RLS policies were weakened.
- No production secrets were requested, copied or committed.
- No fabricated air-quality measurements were introduced.
- PR #8 was not merged and Render was not switched to the unfinished branch.
