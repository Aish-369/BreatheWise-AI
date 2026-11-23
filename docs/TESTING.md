# BreatheWise AI — Verification & Testing Guide

## 1. Running the Automated Suite

All automated checks run against isolated temporary or `:memory:` SQLite databases and never touch production data (`./data/breathewise.db`). The latest GitHub Actions CI run verified formatting, lint, type-check, coverage tests, and the production build:

```bash
npm run format:check  # Prettier formatting verification
npm run lint           # ESLint with zero warnings
npm run typecheck      # TypeScript type-checking (tsc --noEmit)
npm run test:coverage  # Vitest suite with V8 coverage (146 tests across 29 files)
npm run build          # Vite 8 production bundle check
```

---

## 2. Test Coverage Breakdown (116 Tests across 24 Files)

1. **`tests/engine.test.ts` (22 tests)**
   - Freshness boundaries (`<= 2h` fresh, `2–6h` aging, `> 6h` stale, missing/future timestamps unavailable)
   - India CPCB NAQI sub-index derivation & missing-PM2.5 / missing-all-particulates handling
   - Provider divergence warning (`>= 35 AQI` or `>= 35% PM2.5`)
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

6. **Frontend API client (`tests/apiClient.test.ts`, 8 tests)**
   - Request methods and headers, bootstrap query parameters, URL encoding, and JSON body serialization
   - Structured API errors, non-JSON server errors, and network failure normalization

---

## 3. Latest Measured Coverage

The latest successful GitHub Actions run reports 67.66% statement coverage, 60.15% branch coverage, 62.27% function coverage, and 68.69% line coverage across 162 source files. The `App.tsx` entry point is now 100% covered, and the custom hooks folder is at 94.37% statement coverage. The largest remaining coverage gap is the component layer (51.06% statements) and utility layer (19.14% statements).

---

## 4. Environment Note (Headless Browser Testing)

Chromium / Playwright binaries are not installed inside the build container, so visual browser DOM automation and client-side PDF binary download clicks were not executed in an interactive browser engine inside the container. UI components are verified via strict TypeScript compilation (`tsc --noEmit`), Vite 8 production bundling, i18n key parity checks, and live Express HTTP integration tests serving the compiled `dist/` bundle.


7. **Feature views (`tests/featureViews.test.tsx`)**
   - Indoor guidance behavior for unavailable, poor, and moderate outdoor conditions
   - Trust/provenance tiers and safeguards
   - Settings tab navigation, preference callbacks, and clear-data confirmation/cancellation
