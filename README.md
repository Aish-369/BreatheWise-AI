# BreatheWise AI

**Understand Your Air. Protect Your Family. Breathe Better.**

BreatheWise AI is a privacy-conscious, zero-cost **Family Air Protection Intelligence Platform** that transforms environmental air-quality data into clear, explainable, family-oriented daily decisions.

---

## Core Differentiator

Generic AQI dashboards stop at a single city number. BreatheWise AI connects:

`Environmental Data -> Data Quality Validation -> Family Context -> Deterministic Intelligence -> Actionable Daily Plan -> What-If Comparison`

Every recommendation and schedule adjustment includes:
- Plain-language title and suggested action (in **English**, **मराठी**, and **हिन्दी**)
- Applicable family members by age group and routine preference
- Exact supporting evidence (provider, station/grid ID, pollutant values, measurement & retrieval timestamps)
- Confidence & limitation indicators (freshness, coarse-grid disclaimers, missing pollutants, or provider conflicts)
- Clear separation between observed readings, forecasts, demo fixtures, and hypothetical scenarios

> **Disclaimer:** BreatheWise AI provides informational air-quality planning support only. It does not provide medical diagnosis, clinical advice, or guarantees of street-level air safety.

---

## Architecture Overview

```text
React 19 + Tailwind CSS v4 (Presentation Layer)
   ├── Module 1: Editorial Landing Page
   ├── Module 2: Privacy-First Family Onboarding & Local Profile
   ├── Module 3: Household Protection Dashboard
   ├── Module 4: Environmental Intelligence & CAMS Importer
   ├── Module 6: Interactive Daily Protection Planner
   ├── Module 7: What-If Scenario Simulator
   ├── Module 8: Neighborhood Comparison (Pune & Ahilyanagar)
   ├── Module 9: Indoor Protection Guidance
   ├── Module 11: Data Transparency & Methodology
   └── Module 12: History & Printable PDF Reports (jsPDF)
          │
          ▼  (Zod-validated REST API via Express)
Express Server (`server.ts` + `src/server/service.ts`)
   ├── Environmental Adapters (`openaq.ts`, `cpcb.ts`, `camsImporter.ts`, `fixtures.ts`)
   ├── Data Quality & Provenance Engine (`src/engine/quality.ts`)
   ├── Deterministic Family Protection Intelligence (`src/engine/intelligence.ts`)
   └── Local SQLite Persistence (`node:sqlite` in `src/server/db.ts`)
```

---

## Tech Stack & Zero-Cost Compliance

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, jsPDF
- **Backend:** Express (`server.ts`), Vite 8 middleware (dev), Node.js v22 built-in `node:sqlite`
- **Validation & Testing:** Zod, Vitest (24 deterministic unit & integration tests)
- **Zero-Cost Guarantee:** No paid AI/LLM APIs, no cloud databases, no Google Cloud billing, no Open-Meteo dependency. Runs completely locally and continues operating cleanly even when all external providers are offline.

---

## Local Setup & Running

### Prerequisites
- **Node.js v22.x+** (required for built-in `node:sqlite`)
- **npm 10+**

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env` if you wish to test live API keys. **No secrets are required** to run the complete application:
```bash
cp .env.example .env
```
Optional server-side variables (never exposed to browser):
- `OPENAQ_API_KEY`: Free OpenAQ v3 API key (`X-API-Key`).
- `DATA_GOV_IN_API_KEY`: Free `data.gov.in` API key for CPCB CAAQMS feeds.

### 3. Database Setup
SQLite (`./data/breathewise.db`) initializes automatically on first server start using parameterized `node:sqlite` prepared statements, seeding a clearly labelled local demonstration household (`Deshmukh Family (Demo Profile)` in Pune).

### 4. Run in Development
```bash
npm run dev
```
Open `http://localhost:3000`.

### 5. Build & Run Production
```bash
npm run build
npm start
```

### 6. Run Tests & Type Checks
```bash
npm test      # Runs 24 Vitest unit & SQLite integration tests
npm run lint  # Runs tsc --noEmit
```

---

## Environmental Data Providers & Licenses

1. **CPCB / data.gov.in**
   - *License:* Government Open Data License – India (GODL) — commercial and non-commercial use permitted with attribution.
   - *Status:* Server-side adapter implemented; requires free `DATA_GOV_IN_API_KEY` and outbound network reachability to `api.data.gov.in`. Reports `unavailable` / `unconfigured` honestly when unreachable.
2. **OpenAQ API v3**
   - *License:* Aggregated open air quality data with per-source license metadata (`/v3/licenses`). Free tier: 60 req/min, 2,000 req/hr.
   - *Status:* Server-side adapter implemented; requires free `OPENAQ_API_KEY`.
3. **Copernicus Atmosphere Monitoring Service (CAMS)**
   - *License:* Free, perpetual, worldwide EU/CAMS open license with attribution (*"Generated using Copernicus Atmosphere Monitoring Service information [Year]"*).
   - *Status:* Validated manual JSON/CSV forecast importer (`src/server/adapters/camsImporter.ts`) with explicit coarse-grid (~40 km) spatial disclaimers.
4. **Clearly Labelled Demo Fixtures**
   - When live API keys are unconfigured, BreatheWise AI serves explicitly labelled synthetic fixtures for **Pune** (multi-station comparison + sample CAMS forecast) and **Ahilyanagar** (partial coverage, aging timestamp, missing gases & absent forecast) so evaluators can inspect realistic urban vs. regional coverage gaps.

---

## Hackathon Demonstration Script (3 Minutes)

1. **Landing Page -> Workspace:** Introduce the gap between raw AQI numbers and household decisions. Enter the workspace.
2. **Dashboard (Pune Demo Fixture):** Show Reference India NAQI `127 (Moderate)`, pollutant breakdown, and expandable *"Why generated & source evidence"* per family member (Aarav, Sunanda, Priya, Vikram).
3. **Daily Planner:** Show how fixed school commute (`06:00-09:00`) is respected with precautions while flexible morning walk shifts to `12:00-16:00` based on coarse forecast evidence.
4. **What-If Simulator:** Run the *"PM2.5 Spike (145 µg/m³)"* preset—highlight the unmistakable `SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT` banner and side-by-side schedule diff.
5. **Environmental Data & Outage Resilience:** Toggle *"Simulate Provider Outage: On"* to show BreatheWise AI immediately dropping to an honest unavailable state rather than inventing numbers; switch to **City Comparison** to contrast Pune with Ahilyanagar's partial coverage.
6. **Multilingual & PDF Export:** Switch live to **मराठी** or **हिन्दी**, then download the formatted PDF Family Air Protection Brief from **History & Reports**.

---

## Known Limitations

- Without configured `OPENAQ_API_KEY` or `DATA_GOV_IN_API_KEY` (and outbound `api.data.gov.in` connectivity), the app operates with clearly labelled demonstration fixtures or explicit unavailable states.
- Coarse CAMS forecast data (~40 km grid) reflects regional trends and cannot establish street-level safety.
- Multi-week historical charts are not fabricated when archival telemetry has not been collected locally.
- Headless Chromium browser binaries were not pre-installed in the build container, so verification covered 24 Vitest unit/integration tests, TypeScript compilation, production Vite bundling, and live HTTP end-to-end API checks against port 3000.
