# BreatheWise AI — Release Notes

## v1.0.0 (2026-11-21)

### Highlights

- **Deterministic Family Protection Engine v2.0.0:**
  - Added multi-pollutant rules (`NO2 > 80`, `O3 > 100`, coarse-dust `PM10 > 100` with moderate `PM2.5`), non-medical household sensitivity tag rules, historical PM2.5 worsening trend alerts, and structured `ExplainabilityTrail` cards (_Evidence_, _Rule Triggered_, _Household Context_, _When to Reconsider_).
- **Five-Tier Data Provenance Classification:**
  - Strictly distinguishes `verified_live`, `historical_observation`, `forecast_only`, `demo_fixture`, and `unavailable` states across API payloads, UI badges, compatibility warnings, and PDF reports.
- **SQLite Schema v3 & Non-Destructive Migrations:**
  - Added `sensitivity_tags_json` on `households`, `completed_date` on `activity_routines`, `classification` + timestamp deduplication on `environmental_snapshots`, and full CRUD endpoints for members, routines, completion status, locations, settings, and provider licenses.
- **Live Adapter Resilience & Security Hardening:**
  - Added Zod validation, bounded physical value checks, 5-minute TTL caching, 429 retry/backoff for OpenAQ v3 & CPCB (`data.gov.in`), IST timestamp parsing, CSV formula-injection defense in CAMS imports, and Express HTTP security headers.
- **UI Performance, Accessibility & Full Localization (EN / मराठी / हिन्दी):**
  - Added searchable Indian city catalog with disambiguation, saved-location comparison compatibility checker, inline routine/member editing, Escape-closable modals, code-split lazy views + dynamic `jsPDF` import, bundled ES photography assets, and 100% key parity across English, Marathi, and Hindi.
- **Verified Automated Quality Gate:**
  - `npm run lint` (`tsc --noEmit`) — 0 errors
  - `npm test` (Vitest) — 39/39 tests passing across 4 suites
  - `npm run build` (Vite 8) — clean code-split production output
