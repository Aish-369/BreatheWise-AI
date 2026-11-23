# BreatheWise AI — Quality Baseline Audit

**Audit date:** 2026-11-23  
**Repository:** `Aish-369/BreatheWise-AI`  
**Audited branch:** `main`  
**Audited commit:** `b260ad673468771689810482a57df978c47e81d1`  
**Scope:** Read-only Phase 0 discovery; no application/runtime/database changes.

## Executive summary

The latest `main` commit is present in GitHub and the latest main-branch CI run completed
successfully. Render also reports a live deployment for that exact commit. This confirms the
previously merged frontend test expansion is on the deployed branch.

The strongest evidence-backed opportunities are:

1.  **Testing depth:** the latest documented V8 statement coverage is 62.82%; component coverage
    is 44.68%, utility coverage 7.26%, hooks 45.62%, and `App.tsx` 0%. Existing documentation
    explicitly says browser-based Playwright/Chromium flows were not run in CI.
2.  **TypeScript strictness mismatch:** `docs/TESTING.md` and README describe strict TypeScript
    checking, but the current `tsconfig.json` does not enable `strict`, `noImplicitAny`, or
    `strictNullChecks`. The current typecheck passes, but it is not evidence of strict-mode
   coverage.
3.  **Persistence / hosting risk:** production currently creates a local `node:sqlite` database at
    `data/breathewise.db`. Render service metadata reports the Free plan and does not show a
   persistent disk. The existing project audit already warns that ephemeral filesystems may reset
    on redeploy/restart. Durable production persistence is therefore not verified and must not be
    claimed.
4.  **Documentation drift:** README's Getting Started section still says `npm test` has 100 tests
    across 20 files, while the later Testing section and `docs/TESTING.md` report 116 tests across
    24 files.
5.  **Operational hardening:** the Render service has no configured health-check path. Vite
    development config sets `server.allowedHosts: true`; this is development-server configuration,
   not the Express production server, but should be reviewed and restricted where compatible with
    the development environment.

No Hack2Skill evaluation attempt was used. No production data, environment variables, database
schema, or runtime code was changed during this audit.

## Verified repository baseline

- Default branch: `main`
- Main commit: `b260ad673468771689810482a57df978c47e81d1`
- Latest CI run: [Run #158](https://github.com/Aish-369/BreatheWise-AI/actions/runs/45145531103)
- CI result: Success; all 10 workflow steps completed successfully.
-  CI checks: npm install, production dependency audit, Prettier, ESLint (zero warnings),
  TypeScript check, Vitest coverage, and Vite production build.
- Latest Render deploy: `dep-dc208qu1egvs738s3tf0`
- Render deploy result: `live`
- Render deployed commit: `b260ad673468771689810482a57df978c47e81d1`
- Render service branch: `main`
- Render plan / region: Free / Singapore.
- Render health-check path: Not configured.
-  Render persistent disk: No disk is shown in the retrieved service metadata; verify explicitly
  before making persistence guarantees.
- Open pull requests at audit time: None.

## Current project structure and architecture

The repository contains a React + TypeScript + Vite frontend and an Express 4 + TypeScript server.
The server uses Node's built-in synchronous `node:sqlite` (`DatabaseSync`) through
`src/server/db/connection.ts`; database repositories and migrations are under `src/server/db/` and
`src/server/migrations/`. The recommendation engine is deterministic TypeScript under
`src/engine/`. The UI has feature views, shared workspace components, custom hooks,
English/Marathi/Hindi localization, and PDF export utilities.

The repository includes 24 test files and the test guide reports 116 tests. The latest test
inventory includes engine, migrations/API, adapters, localization, accessibility, navigation,
locale, CRUD handlers, and ErrorBoundary tests.

## Findings and priorities

### P0 — Clarify and protect production data durability

**Evidence**

- `server.ts` calls `getDb()` during production startup.
-  `src/server/db/connection.ts` resolves the database to `<process.cwd()>/data/breathewise.db`
  and creates the directory if needed.
- `src/server/db/connection.ts` uses `DatabaseSync`.
-  Render service metadata reports the Free plan and no configured health-check path; no
  persistent disk was present in the returned service details.
-  `docs/PROJECT_AUDIT.md` and README already document the ephemeral filesystem limitation and
  state that the Supabase schema is not yet connected to the runtime.

**Risk**
User data written to local SQLite may not survive container replacement, restart, or redeploy on
ephemeral hosting. A generated Supabase schema/types file is not proof of a connected PostgreSQL
runtime.

**Next action**
Keep this as a documented limitation until a complete asynchronous PostgreSQL repository
migration, household-isolation tests, persistence/restart tests, secure server-only credentials,
and a staged deployment are complete. Do not switch production traffic or modify production schema
as part of score optimization without a separate migration plan and explicit approval.

### P1 — Expand meaningful frontend and user-journey tests

**Evidence**
Latest documented V8 coverage:

- Total statements: 62.82%.
- Components: 44.68%.
- Utils: 7.26%.
- Hooks: 45.62%.
- Root `App.tsx`: 0%.
- Engine: 94.76%.

`docs/TESTING.md` states that Chromium/Playwright is not installed in the CI environment and
interactive browser workflows were not executed there.

**Risk**
A passing unit/API suite does not prove that the core browser workflows work end-to-end. The
earlier Testing score fell from 99 to 78; its cause is not known, so it must be investigated
rather than assumed.

**Next action**
Prioritize tests for `App.tsx`, `useHouseholdData`, `useHouseholdMutations`, API client
timeout/network behavior, PDF export utilities, and user journeys through onboarding, family
editing, planner, simulator, comparison, settings, and reports. Add browser automation only after
confirming the repository/runtime can support it reliably.

### P1 — Align TypeScript configuration with documentation

**Evidence**
-  `tsconfig.json` currently does not set `strict: true`, `noImplicitAny: true`, or
  `strictNullChecks: true`.
- README and testing documentation describe the check as strict TypeScript checking.

**Risk**
The current CI typecheck can pass without enforcing the strictness claimed by the documentation.

**Next action**
Measure the error surface on a separate branch by enabling strict options in a controlled trial.
Fix genuine errors incrementally; do not turn strict mode on and then suppress or weaken
diagnostics. Update docs to accurately describe the effective compiler settings.

### P1 — Correct test-count documentation drift

**Evidence**
README's Getting Started verification block says `npm test` runs 100 tests across 20 files. Its
later Testing section and `docs/TESTING.md` report 116 tests across 24 files.

**Risk**
Contradictory test claims weaken evaluator confidence and make the test baseline unclear.

**Next action**
Update the stale section after re-verifying the actual test command and current test inventory.
Keep one canonical count and date/source for coverage metrics.

### P2 — Review Vite development host policy

**Evidence**
`vite.config.ts` sets `server.allowedHosts: true`.

**Risk**
This disables Vite's host allowlist in development. It is not the Express production server
configuration, so it should not be described as a production vulnerability without further
evidence.

**Next action**
Determine which AI Studio / preview hostnames are required. Replace the blanket allowance with the
narrowest compatible host configuration and verify local, preview, and CI workflows.

### P2 — Configure a production health check

**Evidence**
Render service metadata reports an empty health-check path. The application has an API health
route, and `docs/TESTING.md` documents `GET /api/health`.

**Risk**
Render cannot use an application-level health endpoint for health-check-based deployment
validation when no path is configured.

**Next action**
Confirm whether `/api/health` requires a session cookie or is safe for unauthenticated health
probing. If safe, configure it in a separately reviewed Render service change and verify
deployment behavior. Do not change service settings until the route contract is confirmed.

### P2 — Review rate-limit deployment assumptions

**Evidence**
`src/server/rateLimit.ts` stores counters in an in-memory `Map`; `src/server/app.ts` creates
separate limiters per process.

**Risk**
Limits reset on process restart and are not shared across instances. Render currently reports one
instance, so this is a scalability/operational limitation rather than proof of an immediate
exploit.

**Next action**
Keep the current implementation if the one-instance design is intentional; document the
limitation. Consider a shared store only if multi-instance scaling is planned and can be tested.

## Current CI workflow

`.github/workflows/ci.yml` runs:

1. `npm ci --legacy-peer-deps`
2. `npm audit --omit=dev --audit-level=high`
3. `npm run format:check`
4. `npm run lint` with zero warnings
5. `npm run typecheck`
6. `npm run test:coverage`
7. `npm run build`

The latest run completed successfully. Note that dependency audit currently checks production
dependencies only; decide separately whether full development dependency auditing is appropriate
for this project's toolchain and lockfile.

## Phase 0 acceptance status

- [x] Repository, default branch, and main commit identified.
- [x] Source tree and core configuration inspected.
- [x] CI workflow and latest main run verified.
- [x] Latest test inventory and reported coverage reviewed.
- [x] Server/database architecture inspected.
- [x] Render service and latest deployment inspected.
- [x] Risks prioritized with file-level evidence.
- [x] No production/runtime/database changes made.
- [ ] Local clean-install test run: not executed in this connected GitHub audit environment.
- [ ] Interactive browser/E2E validation: not executed.
-  [ ] Live app browser verification: not completed; direct page fetch was unavailable from the
  inspection environment.

## Recommended execution order

1. Phase 1A: establish reproducible test baseline and add meaningful frontend/API-client tests.
2. Phase 1B: add reliable browser-level core user journeys.
3. Phase 2: trial TypeScript strictness and fix actual type weaknesses.
4. Phase 3: review security configuration and test boundaries without changing production secrets.
5. Phase 4: measure performance before changing it.
6. Phase 5: keyboard/screen-reader accessibility workflows beyond static axe checks.
7. Phase 6: improve challenge alignment and data provenance communication.
8. Phase 7–8: complete E2E/release validation; only then decide whether to spend the final
   Hack2Skill evaluation attempt.

**Score integrity:** 97+/100 remains a target, not a promise. No evaluator score has been re-run;
these audit findings do not establish that the score has improved.
