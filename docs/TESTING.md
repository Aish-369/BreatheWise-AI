# BreatheWise AI — Verification & Testing Guide

## 1. Running the Automated Suite

All automated checks run against isolated temporary or `:memory:` SQLite databases and never touch production data (`./data/breathewise.db`). The latest GitHub Actions CI run [45334418916](https://github.com/Aish-369/BreatheWise-AI/actions/runs/45334418916) verified dependency audit, formatting, lint, type-check, coverage tests, production build, Chromium installation, and browser journeys:

```bash
npm run format:check  # Prettier formatting verification
npm run lint           # ESLint with zero warnings
npm run typecheck      # TypeScript type-checking (tsc --noEmit)
npm run test:coverage  # Vitest suite with V8 coverage (191 tests across 37 files)
npm run build          # Vite 8 production bundle check
npx playwright test    # Chromium browser-level core journeys
```

## 2. Test Coverage Breakdown (191 Tests across 37 Files)

1. **`tests/engine.test.ts` (22 tests)**
   - Freshness boundaries (`<= 2h` fresh, `2–6h` aging, `> 6h` stale, missing/future timestamps unavailable)
   - India CPCB NAQI sub-index derivation & missing-PM2.5 / missing-all-particulates handling
   - Provider divergence warning (`>= 35 AQI` or `>= 35%` PM2.5)
   - Age-group recommendations (`infant_toddler`, `school_child`, `older_adult`, `adult`) across Good, Satisfactory, Moderate, Poor, Very Poor, and Severe bands
   - Fixed routine preservation vs. forecast-backed flexible routine shifting (`adjust_window`, `move_indoors`, `hold_pending_data`)
   - What-If simulator disclaimers (`SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT`), indoor move simulation, and outage confidence drop

2. **`tests/dbAndAdapters.test.ts` (3 tests)**
   - CAMS CSV & JSON parsing and invalid time-window/value validation
   - Complete SQLite CRUD lifecycle (`upsertHousehold`, `addMember`, `deleteMember`, `upsertRoutine`, `deleteRoutine`, `saveForecastSlots`, `savePlanHistory`, `clearAllLocalData`)

3. **`tests/apiAndMigrations.test.ts` (11 tests)**
   - Non-destructive pre-v2 -> v3 migration preserving existing households, members, routines, and plans while backfilling `user_settings`, `saved_locations`, and indexes
   - Non-destructive v2 -> v3 migration preserving data and backfilling `classification`
   - Normalized archiving (`protection_plans`, `recommendations`, `plan_evidence`)
   - Full Express HTTP CRUD & validation against temporary SQLite: `GET /api/health` (schemaVersion 3), `GET /api/bootstrap`, `PUT /api/members/:id`, `PUT /api/routines/:id`, `PATCH /api/routines/:id/completion`, `POST/PUT/DELETE /api/locations`, `GET/PUT /api/settings`, `PUT /api/household` (with `sensitivityTags`), `GET /api/providers`, structured 400/404 JSON error responses without stack leakage, and security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`)

4. **`tests/phase5And6.test.ts` (11 tests)**
   - Five-tier `classifySnapshotTier` verification
   - Intelligence v2.0.0 rules (`NO2 > 80`, `O3 > 100`, coarse-dust `PM10 > 100 & PM2.5 <= 60`, household `sensitivityTags`, `historicalTrend` worsening detection, and `evidenceTrail` presence)
   - Location comparison compatibility (`assessLocationComparisonCompatibility`) across mixed tiers, timestamp skew (`>= 3h`), and missing gases
   - Historical trend timestamp deduplication
   - Mocked `fetch` adapter verification for OpenAQ v3 (429 retry/backoff, weather extraction, bounds rejection, 5-min TTL cache) and CPCB (IST timestamp conversion, `Ahilyanagar -> Ahmednagar` alias, bounds rejection, TTL cache)
   - CAMS CSV formula injection rejection (`=`, `+`, `-`, `@`) and malformed date rejection
   - Snapshot deduplication in SQLite (`listCitySnapshots`)
   - Indian city search & disambiguation
   - Multilingual PDF report model (`buildPdfReportModel`) for `en`, `mr`, and `hi`
   - 100% key parity across `en`, `mr`, and `hi` dictionaries plus zero missing literal `t(lang, '...')` keys across `src/`

5. **Frontend state and recovery (`tests/App.test.tsx`, `tests/useNavigationState.test.tsx`, `tests/useLocale.test.tsx`, `tests/useHouseholdData.test.tsx`, `tests/useHouseholdMutations.test.tsx`, `tests/useEntityCrudHandlers.test.tsx`, `tests/ErrorBoundary.test.tsx`)**
   - Root landing/workspace routing, language delegation, and workspace refresh
   - Bootstrap loading, provider-registry fallback, bootstrap errors, and persisted settings
   - Household save, fixture/outage toggles, CAMS import success/failure, scenario execution, and local-data clearing
   - Navigation defaults, valid/invalid deep links, sub-tab resets, header-menu dismissal, and Escape-key behavior
   - Locale persistence, CRUD handler delegation, and error-boundary recovery

6. **Frontend API client (`tests/apiClient.test.ts`, `tests/apiClientHardening.test.ts`)**
   - Request methods and headers, bootstrap query parameters, URL encoding, and JSON body serialization
   - Structured API errors, non-JSON server errors, network failure normalization, request timeout/abort behavior, safe HTTP fallbacks, and the remaining household/routine/location/settings/provider/import/scenario API operations

7. **Feature views (`tests/featureViews.test.tsx`)**
   - Indoor guidance behavior for unavailable, poor, and moderate outdoor conditions
   - Trust/provenance tiers and safeguards
   - Settings tab navigation, preference callbacks, and clear-data confirmation/cancellation

8. **PDF rendering (`tests/pdfStandardRenderer.test.ts`, `tests/pdfCanvasRenderer.test.ts`)**
   - WinAnsi fallback glyph sanitization when bundled fonts are unavailable
   - DejaVu regular/bold font embedding when assets are available
   - Long-report pagination and multi-section rendering

9. **Form reducers (`tests/formReducers.test.ts`, 11 tests)**
   - Household onboarding mode/step/field updates, sensitivity tag toggling, and member edit lifecycle
   - Planner member selection, templates, routine edit lifecycle, and reset behavior
   - Simulator defaults, numeric overrides, stale/unavailable flags, and omitted-value handling
   - Saved-location field updates, edit loading, and add-form reset\n\n## 3. Latest Measured Coverage

The latest successful GitHub Actions run reports 76.59% statement coverage, 64.45% branch coverage, 67.48% function coverage, and 78.08% line coverage across 162 source files. The `App.tsx` entry point is 100% covered, the custom hooks folder is at 94.37% statement coverage, and `src/utils/api.ts` is at 98.07% statement coverage. The largest remaining coverage gap is the component layer (53.54% statements).

**Health probe regression tests (`tests/healthCheck.test.ts`, 2 tests)** cover both successful database readiness without a session cookie and the generic 503 response when SQLite cannot answer.

## 5. Hosting Readiness Audit

The current connected Render service is on the Free plan. Its service configuration currently reports no attached persistent disk and an empty health-check path. The application now exposes `GET /healthz`, which returns `200 {"status":"ok"}` only when the SQLite database responds to a simple query, and `503 {"status":"unavailable"}` when it cannot.

Before relying on Render health monitoring, set the service's Health Check Path to `/healthz` in the Render dashboard. This is a production setting and has intentionally not been changed by this code-only PR. Likewise, do not treat `BREATHEWISE_DB_PATH` as durable until a persistent volume is actually attached and mounted. No disk has been created, no plan has been upgraded, and no production environment variable has been changed.

## 4. Browser-Level End-to-End Testing

The CI workflow installs Playwright and Chromium as ephemeral test tooling (without changing the application lockfile), then runs `npx playwright test`. The browser suite starts the production-mode Express server against the CI workspace's isolated SQLite database and covers the public landing page, workspace entry/return navigation, and guided household onboarding entry. Failed tests retain traces and screenshots locally for diagnosis. These checks complement—not replace—the Vitest component, API, and engine tests.

## 6. Runtime Configuration and Persistence

- `BREATHEWISE_DB_PATH` optionally selects the SQLite file location. If unset, the application continues to use `./data/breathewise.db`.
- For a hosting provider with a mounted persistent disk, configure `BREATHEWISE_DB_PATH` to a file path inside that mounted disk (for example, `/var/data/breathewise.db` only when the disk is actually mounted at `/var/data`).
- This setting does **not** create or attach a persistent disk. The current Render audit did not verify a persistent disk, so production data durability is not guaranteed by this code change. Do not migrate or copy production data as part of setting this variable.
- `VITE_ALLOWED_HOSTS` is an optional comma-separated list of exact Vite development/preview hostnames. Localhost and IP addresses remain allowed by Vite defaults. Do not set broad wildcards; add only the hostnames required by a trusted preview environment.
- `DISABLE_HMR` and file-watch behavior are intentionally unchanged.

The current runtime still uses synchronous SQLite. A durable multi-instance production architecture requires a separately planned asynchronous PostgreSQL repository migration, household-isolation tests, persistence/restart tests, and a controlled deployment. No production database, secret, or hosting setting is changed by these configuration options. The connected Render service audit also found that the Health Check Path is currently unset; configure it to `/healthz` only after reviewing the production settings change.
