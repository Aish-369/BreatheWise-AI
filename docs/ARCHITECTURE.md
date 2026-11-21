# BreatheWise AI — Technical Architecture & Hackathon Pitch

## 1. Layered Separation of Concerns

- **Shared Contracts (`src/shared/types.ts`):** Canonical TypeScript types and Zod validation schemas shared across frontend, backend API routes, and tests.
- **Data Quality & Provenance (`src/engine/quality.ts`):**
  - Freshness classification: `fresh` (<= 2h), `aging` (2–6h), `stale` (> 6h), `unavailable`.
  - Transparent CPCB India NAQI sub-index derivation (`deriveAqiFromPollutants`) explicitly flagged as `isDerived: true` whenever an official index is absent.
  - Inter-provider conflict detection (`detectProviderConflict`) flagging >= 35 AQI or >= 35% PM2.5 divergence.
- **Deterministic Family Protection Engine (`src/engine/intelligence.ts`):**
  - Pure, side-effect-free TypeScript rules mapping environmental evidence + age groups (`infant_toddler`, `school_child`, `adult`, `older_adult`) + activity intensity + fixed/flexible routine constraints + forecast slots into explainable `Recommendation` and `DailyPlanItem` outputs.
  - `runWhatIfScenario` executes the identical rule engine on hypothetical overrides and stamps `SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT`.
- **Replaceable Environmental Adapters (`src/server/adapters/`):**
  - `openaq.ts`, `cpcb.ts`, `camsImporter.ts`, and `fixtures.ts` implement strict provenance typing (`physical_station`, `city_bulletin`, `modeled_estimate`, `forecast`, `hypothetical_scenario`).
- **SQLite Persistence (`src/server/db.ts`):**
  - Uses Node 22 built-in `node:sqlite` (`DatabaseSync`) with WAL mode, foreign keys, and parameterized prepared statements.

## 2. Short Product Pitch (60 Seconds)

> Urban families do not struggle because AQI numbers are hard to find—they struggle because a single number cannot tell a parent whether a child can play outdoors, how a senior should time a morning walk, or whether a sensor reading is six hours stale.
>
> **BreatheWise AI** turns raw environmental telemetry into an explainable daily protection plan for every member of your household. Powered by a zero-cost, deterministic TypeScript intelligence engine, it verifies data freshness, respects fixed school and work commitments, shifts flexible routines only when forecast evidence supports it, and lets families test What-If pollution scenarios in English, Marathi, and Hindi—without medical guesswork or fabricated numbers.

## 3. Known Security & Privacy Safeguards

- API keys (`OPENAQ_API_KEY`, `DATA_GOV_IN_API_KEY`) are read exclusively via `process.env` on the Express server and never bundled into browser code.
- All API request bodies and manual CAMS CSV/JSON imports are validated via Zod schemas before database writes.
- All SQLite queries use parameterized prepared statements (`?` placeholders).
- Household profiles store non-medical age groups and routine preferences locally in SQLite with one-click full local data deletion (`DELETE /api/local/clear`).
