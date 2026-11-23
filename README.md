# BreatheWise AI

> **Chosen Vertical:** Family Air-Quality Protection Intelligence
> **Primary Persona:** Household coordinator planning daily outdoor and indoor routines for a multi-age family (infants/toddlers, school-age children, adults, and older adults).
> **Core Value:** Transforms verified environmental air-quality data into deterministic, evidence-linked family protection plans, time-window shifts, and multilingual reports.

---

## Requirement to Implementation Mapping

| Hackathon Requirement                      | Implemented Feature                                                                                                                                                                                                               | Primary File(s) & Location                                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Smart, dynamic environmental assistant** | Multi-tier data classification (`verified_live`, `historical_observation`, `forecast_only`, `demo_fixture`, `unavailable`), automatic CAMS & station ingestion, staleness detection, and fail-safe outage holdback                | `src/engine/quality.ts`, `src/server/service.ts`, `src/server/adapters/` (`cpcb.ts`, `openaq.ts`, `camsForecast.ts`, `camsImporter.ts`)                                                  |
| **Logical context-driven decision making** | Deterministic rule engine scoring household age sensitivity, non-medical sensitivity tags, routine flexibility (`fixed` vs `flexible`), and CAMS time-window optimization with full evidence trails                               | `src/engine/intelligence.ts`, `src/engine/plan/` (`evidence.ts`, `riskScoring.ts`, `windowSelection.ts`, `actions.ts`, `contextActions.ts`, `dailyPlan.ts`, `summary.ts`, `scenario.ts`) |
| **Practical real-world usability**         | Daily routine planner & completion tracking, What-If scenario simulator, multi-city compatibility comparison, Copernicus CAMS CSV/JSON import, offline PDF reports (Devanagari-safe), and 3-language UI (English, Marathi, Hindi) | `src/components/` (`DashboardView.tsx`, `PlannerView.tsx`, `SimulatorView.tsx`, `ComparisonView.tsx`, `EnvironmentView.tsx`), `src/i18n/`, `src/utils/pdfExport.ts`                      |
| **Clean, maintainable, modular codebase**  | Domain-split backend repositories, resource-scoped Express routers with Zod validation & session isolation, typed React hooks/reducers, ESLint + jsx-a11y + Prettier + Vitest CI pipeline                                         | `src/server/db/`, `src/server/routes/`, `src/hooks/`, `eslint.config.js`, `.github/workflows/ci.yml`                                                                                     |

---

## Approach & Decision Logic

BreatheWise AI separates environmental evidence validation from household planning so recommendations never disguise forecasts, illustrative samples, or stale telemetry as live readings:

```text
1. Inputs                 -> Household profile, member age groups, fixed/flexible routines, saved cities
2. Provenance & Quality   -> Validate pollutant bounds & timestamps (fresh <= 2h, aging 2-6h, stale > 6h)
3. Risk Scoring           -> Derive India CPCB NAQI sub-indices, flag provider conflicts, score age sensitivity
4. Time-Window Selection  -> Compare baseline PM2.5/AQI against coarse CAMS forecast slots for cleaner windows
5. Action Building        -> Shift flexible routines or add precautions for fixed commitments; hold if unavailable
6. Explainable Evidence   -> Attach Evidence Metric, Rule Triggered, Household Context, and Reconsideration Trigger
```

### Concrete Worked Example (Pune Household)

Given a **Pune (Shivajinagar)** snapshot at **NAQI 127 (`moderate`)** with **PM2.5 = 68 µg/m³**, **PM10 = 124 µg/m³**, `fresh` status, and an accompanying CAMS forecast showing **06:00–09:00 (`~76 µg/m³`)** improving to **12:00–16:00 (`~44 µg/m³`)**:

1. **Flexible Routine — Neighborhood morning walk (`06:00–09:00`, Older adult + Adult):**
   - `windowSelection.ts` (`findCleanerForecastWindow`) verifies that `12:00-16:00` drops expected PM2.5 by >= 18% and >= 8 µg/m³ (`68 -> 44 µg/m³`).
   - Output status: **`adjust_window`** -> suggested **`12:00-16:00`**, tagged with `coarse_grid_forecast` limitation notice.
2. **Fixed Routine — School commute & morning assembly (`06:00–09:00`, School child + Adult):**
   - Because `flexibility === 'fixed'`, `dailyPlan.ts` preserves the `06:00-09:00` schedule without moving an unmovable commitment.
   - Output status: **`proceed_with_precautions`** with route/exertion guidance and evidence metric `PM2.5 68 µg/m³ · NAQI 127`.
3. **Outage / Stale Telemetry Fallback:**
   - If live station feeds are unavailable (`isAvailable === false`) or older than 6 hours (`stale`), outdoor recommendations switch to **`hold_pending_data`** instead of inventing numbers, while indoor routines continue unaffected.

---

## Modular Architecture

```text
src/
├── engine/
│   ├── intelligence.ts           # Thin orchestrator preserving public engine API
│   ├── quality.ts                # CPCB NAQI sub-indices, freshness, conflict & compatibility checks
│   └── plan/                     # Pure planning pipeline (evidence, riskScoring, windowSelection, actions, dailyPlan, summary, scenario)
├── server/
│   ├── app.ts                    # Express middleware stack, security headers, rate limiting, router mounting
│   ├── errors.ts                 # Centralized AppError hierarchy, assertFound, Zod/JSON error middleware
│   ├── rateLimit.ts              # Fixed-window memory-bounded API rate limiter
│   ├── service.ts                # Environment & bootstrap orchestration across providers, cache, and DB
│   ├── adapters/                 # httpClient (retry/TTL cache), cpcb, openaq, camsForecast, camsImporter, fixtures
│   ├── db/                       # SQLite repositories (connection, households, members, routines, locations, settings, snapshots, plans, sessions)
│   └── routes/                   # Resource-scoped Express routers (session, healthAndBootstrap, household, members, routines, locations, environment, local)
├── hooks/                        # useHouseholdData, useNavigationState, useLocale
├── components/                   # Focused UI views + subcomponents (workspace, dashboard, family, planner, simulator, comparison, environment, history, settings, trust, landing, charts)
├── i18n/                         # Strict key-parity dictionaries (en, mr, hi) with compile-time AssertExactKeys guard
├── shared/                       # Canonical Zod schemas, TypeScript domain contracts, Indian city metadata
└── utils/                        # Typed API client + modular Devanagari-safe PDF exporters
```

---

## Data Transparency & Trust Tiers

BreatheWise AI distinguishes five environmental data states and never disguises synthetic or modeled values as live station readings:

| Classification             | Meaning                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------- |
| **Verified Live**          | Recent physical station observation (`<= 6h`)                                      |
| **Historical Observation** | Older physical station observation (`> 6h`, flagged as stale)                      |
| **Forecast / Coarse Grid** | Regional model forecast (~40 km CAMS grid; trend guidance only)                    |
| **Illustrative Sample**    | Clearly labelled synthetic reference data when live keys are disabled/unconfigured |
| **Unavailable**            | No valid observation available; outdoor guidance safely held pending data          |

---

## Key Capabilities

- **Family Protection Planner:** Multi-member age profiles (`infant_toddler`, `school_child`, `adult`, `older_adult`), optional non-medical sensitivity tags, and fixed vs. flexible daily routine scheduling with completion tracking.
- **What-If Scenario Simulator:** Test hypothetical PM2.5/PM10/AQI shifts, forecast trend changes, or outage states side-by-side against baseline evidence (explicitly watermarked as non-observed scenarios).
- **Multi-Location Comparison:** Side-by-side city comparison with automatic compatibility warnings for mixed data tiers, missing pollutants, or >3h timestamp skew.
- **Copernicus CAMS Forecast Import:** Validated JSON and CSV import (`parseCamsImport`) with CSV formula-injection defense and household-scoped persistence.
- **Multilingual & Offline PDF Reports:** Complete English, Marathi (मराठी), and Hindi (हिन्दी) parity enforced at compile time, plus Devanagari-capable client PDF export.
- **Privacy-First Local Storage:** Local `node:sqlite` persistence with zero paid AI/LLM API dependencies.

---

## Getting Started

### Prerequisites

- Node.js 22.x or newer (`node:sqlite` built-in)
- npm 10 or newer

### Run Locally

```bash
npm install
cp .env.example .env   # Optional: add DATA_GOV_IN_API_KEY and/or OPENAQ_API_KEY
npm run dev            # Starts Express + Vite dev server on http://localhost:3000
```

External API keys in `.env` are optional; local illustrative-data and CAMS-import workflows run without external credentials. Never expose keys in `VITE_*` variables or commit `.env`.

### Verification & Quality Checks

```bash
npm run lint           # ESLint (typescript-eslint + react-hooks + jsx-a11y, zero warnings)
npm run typecheck      # TypeScript strict check (tsc --noEmit)
npm run format:check   # Prettier formatting check
npm test               # Vitest suite (52 tests across 7 files)
npm run build          # Production Vite client bundle
```

---

## Assumptions, Limitations & Production Notes

- **Non-Medical Aid:** BreatheWise AI is an informational daily planning aid, not a medical device or clinical diagnostic tool. Household sensitivity tags reflect user preferences only.
- **Provider Coverage:** Live station reads depend on optional server-side `DATA_GOV_IN_API_KEY` (CPCB) and `OPENAQ_API_KEY` credentials and outbound network availability; coarse-grid CAMS forecasts (~40 km) do not represent street-level pollution peaks.
- **Local SQLite & Ephemeral Hosting Caveat:** The runtime stores data in local SQLite (`node:sqlite`). Free/ephemeral hosting containers (such as Render Free) may reset local filesystems on redeploy or restart—do not store sensitive personal data on ephemeral public deployments.
- **Browser Session Isolation (Not Account Auth):** Production mode isolates households via a cryptographically random 256-bit `HttpOnly; SameSite=Lax; Secure` cookie (with SHA-256 token hashes stored in SQLite, 30-day TTL), CSRF same-origin HTTPS checks on unsafe routes, strict CSP/HSTS headers, and `no-store` API caching. There is no password login or cross-device sync.
- **Testing Scope:** The 52 Vitest tests cover engine decision rules, NAQI/freshness quality checks, CPCB/OpenAQ adapters, SQLite migrations, API validation/session isolation, and rate limiting. Automated Playwright browser tests and live external provider integration tests are not part of the offline test suite.

---

## Additional Documentation

| Document                | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `docs/ARCHITECTURE.md`  | System architecture and database schema design              |
| `docs/DATA_SOURCES.md`  | Environmental providers, data classification, and licensing |
| `docs/TESTING.md`       | Automated testing strategy and test suites                  |
| `docs/USER_GUIDE.md`    | End-user workflows and workspace guide                      |
| `docs/RELEASE_NOTES.md` | Release changelog                                           |
| `docs/PROJECT_AUDIT.md` | Pre-refactor repository audit notes                         |

---

## License

This repository does not currently declare an open-source license; all rights remain reserved by the copyright holder. External environmental datasets remain subject to their respective provider licenses (GODL India, OpenAQ, Copernicus CAMS).
