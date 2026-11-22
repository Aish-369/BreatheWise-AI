# BreatheWise AI — Technical Architecture (v1.0.0)

## 1. Architectural Layers

- **Shared Contracts & Catalogs (`src/shared/`):**
  - `types.ts`: Canonical TypeScript interfaces and Zod validation schemas shared across frontend, backend Express routes, and tests (`DataClassification`, `SensitivityTag`, `ExplainabilityTrail`, `SavedLocation`, `UserSettings`, etc.).
  - `indianCities.ts`: Curated metadata and alias catalog for Indian cities (canonical names such as *Ahilyanagar / Ahmednagar*, *Chhatrapati Sambhajinagar / Aurangabad*, coordinates, and disambiguation hints).
- **Data Quality, Provenance & Trend Engine (`src/engine/quality.ts`):**
  - Five-tier snapshot classification (`classifySnapshotTier`): `verified_live`, `historical_observation`, `forecast_only`, `demo_fixture`, `unavailable`.
  - Freshness boundaries (`classifyFreshness`): `fresh` (<= 2h), `aging` (2–6h), `stale` (> 6h), `unavailable` (missing or > 20 min future skew).
  - Official India CPCB NAQI sub-index derivation (`deriveAqiFromPollutants`) explicitly flagged `isDerived: true` when station AQI is omitted.
  - Inter-provider divergence checks (`detectProviderConflict`) flagging `>= 35 AQI` or `>= 35% PM2.5` gap.
  - Multi-snapshot historical trend detection (`analyzeHistoricalTrend`) and cross-location comparison compatibility (`assessLocationComparisonCompatibility`).
- **Deterministic Family Protection Engine (`src/engine/intelligence.ts`, `RULE_SET_VERSION = "2.0.0"`):**
  - Pure side-effect-free TypeScript rules combining validated environmental snapshots, household sensitivity tags, member age/activity profiles, fixed vs. flexible routine scheduling, and historical trend shifts.
  - Attaches structured `ExplainabilityTrail` objects to every recommendation.
  - `runWhatIfScenario` executes the same engine over user-configured overrides and stamps `SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT`.
- **Server Layer (`src/server/`):**
  - `migrations.ts`: Idempotent transactional SQLite schema migrations (`v1` base tables, `v2` normalized `saved_locations`, `user_settings`, `recommendations`, `plan_evidence`, `data_providers`, `license_attributions`, and `v3` `sensitivity_tags_json`, `completed_date`, snapshot `classification` & dedup index).
  - `db.ts`: Built-in `node:sqlite` (`DatabaseSync`) with WAL mode, foreign keys enabled, parameterized `?` queries, transaction wrappers, and snapshot deduplication.
  - `adapters/`: `openaq.ts` (v3 JSON schema validation, 5-minute TTL cache, 429 retry/backoff, bounds checks, weather extraction), `cpcb.ts` (GODL JSON validation, IST timestamp parser, city alias mapping, TTL cache), `camsImporter.ts` (Zod JSON + CSV parser with formula-prefix injection protection), and `fixtures.ts`.
  - `app.ts` & `errors.ts`: Express 4 REST API with strict Zod input validation, centralized JSON error mapping (`AppError`, `ZodError`, invalid JSON), `x-powered-by` disabled, and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-origin`, `Permissions-Policy`).
- **Frontend Layer (`src/`):**
  - Code-split React 19 UI using `React.lazy` + `<Suspense>` across workspace tabs, central typed API client (`src/utils/api.ts`), React `ErrorBoundary`, and dynamically imported `jsPDF` multilingual PDF generator (`src/utils/pdfExport.ts`).

## 2. Safeguards & Privacy

- External API keys (`OPENAQ_API_KEY`, `DATA_GOV_IN_API_KEY`) are read exclusively server-side via `process.env`.
- Household records are non-medical, remain strictly local in SQLite (`./data/breathewise.db`), and can be wiped via one click (`DELETE /api/local/clear`) or reset cleanly to the demo fixture (`POST /api/local/reset-demo`).
- Outages never silently fall back to synthetic values: `simulateOutage=true` with `useFixtures=false` surfaces an explicit unavailable state.
