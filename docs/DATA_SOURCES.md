# Environmental Data Sources, Provenance Tiers & Licenses

BreatheWise AI enforces strict provenance transparency so users always know what kind of data drives a recommendation.

---

## 1. Five Data Classification Tiers

| Tier (`classification`) | Badge Meaning | Behavior in Planner |
| --- | --- | --- |
| `verified_live` | Physical station reading <= 6h old (`fresh` <= 2h or `aging` 2–6h) | Enables full protection guidance; warns if `aging` |
| `historical_observation` | Physical station reading > 6h old (`stale`) | Holds flexible outdoor window shifting; warns about staleness |
| `forecast_only` | Modeled coarse-grid trend (e.g., Copernicus CAMS ~40 km grid) | Advises flexible window shifts with explicit coarse-grid disclaimer |
| `demo_fixture` | Synthetic local demonstration profile | Displayed with unmistakable Demo Fixture banner |
| `unavailable` | No valid reading available (e.g., unconfigured keys, offline, or outage) | Never invents numbers; switches flexible outdoor plans to `hold_pending_data` |

---

## 2. Supported Providers, Free Tiers & Exact User Setup

### A. Central Pollution Control Board (CPCB) via data.gov.in
- **Adapter:** `src/server/adapters/cpcb.ts`
- **Dataset & Endpoint:** `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69` (Real-time Air Quality Index from various locations)
- **License:** Government Open Data License – India (GODL) — free commercial and non-commercial use permitted with attribution.
- **User Configuration Steps:**
  1. Register a free account at `https://data.gov.in` and generate your personal API key from your profile dashboard (avoid relying on shared sample documentation keys, which are heavily rate-limited).
  2. Copy `.env.example` to `.env` in the project root (`cp .env.example .env`) and set:
     ```env
     DATA_GOV_IN_API_KEY=your_data_gov_in_key_here
     ```
  3. Restart `npm run dev` or `npm start`. Keys stay strictly server-side in `process.env`.
- **Adapter Behavior:** Converts IST (`DD-MM-YYYY HH:mm:ss`) timestamps to UTC ISO-8601, rejects out-of-range pollutants (`PM2.5 > 2000`, `PM10 > 3000`, `NO2 > 2000`, `O3 > 1500`, `SO2 > 2000`, `CO > 100`), caches valid responses for 5 minutes server-side, retries transient `429`/`5xx` once, and maps legacy CPCB names (`Ahilyanagar` -> `Ahmednagar`, `Chhatrapati Sambhajinagar` -> `Aurangabad`).

### B. OpenAQ API v3
- **Adapter:** `src/server/adapters/openaq.ts`
- **Endpoint:** `https://api.openaq.org/v3/locations` (`X-API-Key` request header)
- **License & Free Tier:** Aggregated OpenAQ open data (per-station license metadata). Standard free API key tier permits **60 requests/minute** and **2,000 requests/hour**.
- **User Configuration Steps:**
  1. Register a free account and generate an OpenAQ v3 API key via OpenAQ Explorer: `https://explore.openaq.org/register`.
  2. Add it to `.env` on the server:
     ```env
     OPENAQ_API_KEY=your_openaq_v3_key_here
     ```
  3. Restart the Express server. Never place keys in Vite `VITE_*` client variables.
- **Adapter Behavior:** Queries stations within 25 km of known Indian city coordinates (or `iso=IN` fallback), enforces Zod response validation & pollutant bounds checks, extracts optional weather fields (`temperatureC`, `relativeHumidityPct`, `windSpeedMs`), retries `429`/`5xx` once respecting `Retry-After`, and applies a 5-minute TTL cache to conserve free-tier quota.

### D. Automatic CAMS Global Forecast (Open-Meteo delivery)

- **Adapter:** `src/server/adapters/camsForecast.ts`
- **Endpoint:** `https://air-quality-api.open-meteo.com/v1/air-quality` with `domains=cams_global`.
- **Credentials:** No API key is required for eligible non-commercial use.
- **Coverage:** CAMS Global atmospheric composition forecast, approximately 0.4° / 45 km grid, 3-hourly model output and up to 5 forecast days. It is a modeled regional forecast, never a physical station observation or street-level measurement.
- **Attribution:** Credit Copernicus Atmosphere Monitoring Service (CAMS) and Open-Meteo. Open-Meteo data is provided under CC BY 4.0; check Open-Meteo's current terms before any commercial use.
- **Freshness semantics:** The public response does not provide a reliable model-run issue timestamp in the fields consumed by this adapter. The app records retrieval time in the existing `issuedAt` field; it must not be interpreted as the model's official issue time.
- **Precedence:** A household's validated manual CAMS import takes precedence over the automatic forecast. Automatic forecasts are used when no manual import exists for the selected city.

### C. Copernicus Atmosphere Monitoring Service (CAMS) — Manual Offline Import vs. Automated CDS API
- **Adapter:** `src/server/adapters/camsImporter.ts`
- **License:** Copernicus Open License (Free, Perpetual, Worldwide, Commercial Allowed). Mandatory attribution: *"Generated using Copernicus Atmosphere Monitoring Service information [Year]"*.
- **Manual Import vs. Automated Retrieval:**
  - **Manual File / Paste Import (Built into App, Zero-Cost Offline Ready):** Upload a `.csv` / `.json` file or paste forecast rows directly under **Air Quality -> CAMS Forecast**. Works completely offline with zero external credentials.
  - **Automated Retrieval via Copernicus ADS (`cdsapi`, External):** Copernicus ADS API calls (`https://ads.atmosphere.copernicus.eu/api`) run asynchronously over NetCDF/GRIB scientific datasets (often 50+ MB) using Python `cdsapi` and a user's personal `.cdsapirc` key. Because running Python `cdsapi` and NetCDF decoding inside a lightweight Node.js household app is impractical for low-RAM laptops (`i5-6300U` / `7.68 GB RAM`), BreatheWise intentionally does **not** auto-poll ADS in the background. Users who want automated daily CAMS pulls can schedule a tiny zero-cost Python `cdsapi` export externally and upload the resulting CSV/JSON file in-app.

#### Accepted CSV Schema
```csv
city,grid_id,forecast_date,time_window,expected_pm25,expected_pm10,trend
Pune,CAMS-GLOBAL-0.4DEG,2026-11-21,06:00-09:00,74,132,worsening
Pune,CAMS-GLOBAL-0.4DEG,2026-11-21,12:00-16:00,40,82,improving
```
Supported `time_window` values: `06:00-09:00`, `09:00-12:00`, `12:00-16:00`, `16:00-19:00`, `19:00-22:00`.

#### Accepted JSON Schema
```json
{
  "city": "Pune",
  "gridId": "CAMS-GLOBAL-0.4DEG",
  "issuedAt": "2026-11-21T06:00:00.000Z",
  "slots": [
    {
      "forecastDate": "2026-11-21",
      "timeWindow": "12:00-16:00",
      "expectedPm25": 40,
      "expectedPm10": 82,
      "trend": "improving"
    }
  ]
}
```
Cells starting with CSV formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`) or invalid dates/bounds are rejected.

---

## 3. Offline Fallback, Conflict & Outage Handling

- **Offline / Unconfigured Fallback:** When neither API key is set or external providers fail/time out, BreatheWise AI serves clearly marked **Demo Fixtures** only if `useDemoFixtures` is enabled in Settings; otherwise it surfaces an honest **Unavailable** state (`mode: 'unavailable'`) and holds flexible outdoor scheduling (`hold_pending_data`) without inventing measurements.
- **Provider Conflict:** When two valid providers in the same city differ by `>= 35 AQI` or `>= 35% PM2.5`, `detectProviderConflict` raises `conflict_provider_divergence` inside the plan evidence drawer and recommendations.
