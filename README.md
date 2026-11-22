# BreatheWise AI

**Understand Your Air. Protect Your Family. Breathe Better.**

BreatheWise AI is a privacy-conscious, zero-cost, local-first **Family Air Protection Intelligence Platform** that transforms environmental air-quality telemetry into transparent, explainable, family-oriented daily planning decisions.

---

## Core Differentiator

Generic AQI dashboards stop at a single city number. BreatheWise AI connects:

`Environmental Data -> Provenance & Quality Validation -> Household Context -> Deterministic Intelligence (v2.0.0) -> Actionable Daily Plan -> What-If Scenario Simulator`

Every recommendation and schedule adjustment includes:
- Plain-language title, explanation, and suggested action in **English**, **मराठी**, and **हिन्दी**
- Applicable family members by age group (`infant_toddler`, `school_child`, `adult`, `older_adult`), routine flexibility (`fixed` vs `flexible`), and optional non-medical household sensitivity tags (`dust_sensitive`, `respiratory_comfort`, `high_outdoor_exertion`, `elder_mobility_care`, `early_commute_exposure`)
- Four-part **Evidence & Explainability Trail** (`evidenceMetric`, `ruleTriggered`, `householdContext`, `reconsiderWhenKey`)
- Explicit 5-tier data classification separating **Verified Live**, **Historical Observation**, **Forecast / Coarse Grid**, **Demo Fixture**, and **Unavailable** states — never disguising demo, historical, or forecast data as live telemetry
- Printable / downloadable localized PDF Family Air Protection Reports (`jsPDF` with Devanagari canvas rendering for Marathi & Hindi)

> **Non-Medical Disclaimer:** BreatheWise AI is an environmental awareness and daily activity planning aid only. It does not diagnose medical conditions, prescribe clinical interventions, or guarantee street-level air safety.

---

## Architecture Overview

```text
React 19 + Vite 8 + Tailwind CSS 4 (Code-Split Lazy Presentation Layer)
   ├── Editorial Landing Page (`LandingPage.tsx`)
   ├── Dashboard & Action Center (`DashboardView.tsx`, lazy `pdfExport.ts`)
   ├── Privacy-First Family Profile & Sensitivity Tags (`FamilyOnboardingView.tsx`)
   ├── Air Quality, Station Telemetry & CAMS Importer (`EnvironmentView.tsx`)
   ├── Daily Planner with Inline Edit & Completion Toggle (`PlannerView.tsx`)
   ├── What-If Scenario Simulator (`SimulatorView.tsx`)
   ├── Saved Locations CRUD & Compatibility Comparison (`ComparisonView.tsx`)
   ├── Indoor Guidance (`IndoorGuidanceView.tsx`), History (`HistoryView.tsx`) & Settings/Trust (`SettingsView.tsx`, `TrustView.tsx`)
          │
          ▼  (Typed client API in `src/utils/api.ts` -> Express 4 + Zod)
Express 4 Server (`server.ts` + `src/server/app.ts` + `src/server/service.ts`)
   ├── Environmental Adapters (`openaq.ts`, `cpcb.ts`, `camsImporter.ts`, `fixtures.ts`)
   ├── Data Quality, 5-Tier Classification & Trend Engine (`src/engine/quality.ts`)
   ├── Deterministic Family Protection Intelligence v2.0.0 (`src/engine/intelligence.ts`)
   └── Versioned Local SQLite Persistence (`node:sqlite` DatabaseSync, Schema v3)
```

---

## Tech Stack & Zero-Cost Compliance

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion, Lucide Icons, lazy-loaded `jsPDF`
- **Backend:** Express 4 (`server.ts` / `src/server/app.ts`), Vite 8 middleware (dev), Node.js v22 built-in `node:sqlite` (`DatabaseSync`, WAL mode, foreign keys, versioned migrations up to v3)
- **Validation & Testing:** Zod, Vitest (39 automated unit, adapter, migration, API, and i18n key-parity tests)
- **Zero-Cost Guarantee:** Zero paid AI/LLM APIs, zero cloud databases, zero paid subscriptions, and full offline/outage fallback. Continues operating cleanly when internet connectivity or upstream API keys are absent.

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
Copy `.env.example` to `.env` if you want to test live external APIs. **No API keys are required** to run the app:
```bash
cp .env.example .env
```
Optional server-side variables (never bundled into client code):
- `OPENAQ_API_KEY`: Free OpenAQ v3 API key (`X-API-Key`).
- `DATA_GOV_IN_API_KEY`: Free `data.gov.in` API key for CPCB CAAQMS feeds.

### 3. Database Initialization & Migrations
SQLite (`./data/breathewise.db`) initializes automatically on first server startup via versioned migrations (`001`–`003`) using parameterized `node:sqlite` prepared statements. When empty, it seeds a clearly labelled demonstration household (`Deshmukh Family (Demo Profile)` in Pune) and saved demo locations. Existing user data is always preserved across migrations.

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

### 6. Type Check & Automated Tests
```bash
npm run lint  # tsc --noEmit
npm test      # vitest run (39 tests across 4 suites using isolated temp/in-memory DBs)
```

---

## Documentation Index

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System architecture, SQLite schema v3, security headers, and intelligence v2.0.0
- [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) — CPCB, OpenAQ v3, Copernicus CAMS ADS import workflow, 5-tier provenance classification, and licenses
- [`docs/TESTING.md`](docs/TESTING.md) — Automated Vitest suite, live HTTP verification, and verification limitations
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) — End-user workflow guide for all workspace views, localization, and PDF export
- [`docs/RELEASE_NOTES.md`](docs/RELEASE_NOTES.md) — Version `1.0.0` release summary
