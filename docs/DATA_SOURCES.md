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

## 2. Supported Providers & Licenses

### A. Central Pollution Control Board (CPCB) via data.gov.in
- **Adapter:** `src/server/adapters/cpcb.ts`
- **License:** Government Open Data License – India (GODL) — commercial and non-commercial use allowed with attribution.
- **Configuration:** Optional free API key via server environment variable `DATA_GOV_IN_API_KEY`.
- **Details:** Parses CPCB CAAQMS pollutant feeds, converts IST (`DD-MM-YYYY HH:mm:ss`) timestamps to UTC ISO-8601, rejects out-of-range readings (`PM2.5 > 2000`, `PM10 > 3000`, etc.), caches valid responses for 5 minutes server-side, and handles city renames (e.g., `Ahilyanagar` -> `Ahmednagar`, `Chhatrapati Sambhajinagar` -> `Aurangabad`).

### B. OpenAQ API v3
- **Adapter:** `src/server/adapters/openaq.ts`
- **License:** OpenAQ Aggregated Open Data (per-station open license metadata).
- **Configuration:** Optional free API key via server environment variable `OPENAQ_API_KEY`.
- **Details:** Queries station locations by coordinates (radius 25 km for known Indian cities) or `iso=IN` fallback, validates payload via Zod, enforces bounded pollutant checks, extracts optional ambient weather (`temperatureC`, `relativeHumidityPct`, `windSpeedMs`), retries transient `429`/`5xx` once, and applies a 5-minute TTL cache.

### C. Copernicus Atmosphere Monitoring Service (CAMS) — ADS Manual Import Workflow
- **Adapter:** `src/server/adapters/camsImporter.ts`
- **License:** Copernicus Open License (Free, Perpetual, Worldwide, Commercial Allowed). Mandatory attribution: *"Generated using Copernicus Atmosphere Monitoring Service information [Year]"*.
- **Zero-Cost Obtaining Workflow (Copernicus ADS):**
  1. Register a free account on the Copernicus Atmosphere Data Store (ADS): `https://ads.atmosphere.copernicus.eu/`.
  2. Accept the Copernicus CAMS dataset license in your ADS profile and copy your free `.cdsapirc` token if using the `cdsapi` Python client (`cams-global-atmospheric-composition-forecasts`).
  3. Export a daily summary into either CSV or JSON matching the BreatheWise import schema below, then paste or upload in **Air Quality -> Import CAMS Forecast**.

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
Cells starting with CSV formula prefixes (`=`, `+`, `-`, `@`, tab, CR) or invalid dates/bounds are automatically rejected.

---

## 3. Conflict & Outage Handling

- **Provider Conflict:** When two valid providers in the same city differ by `>= 35 AQI` or `>= 35% PM2.5`, `detectProviderConflict` raises `conflict_provider_divergence` inside the plan evidence drawer and recommendations.
- **Unreachable / Unconfigured APIs:** Reported transparently via `GET /api/providers` and workspace badges (`status: 'unavailable' | 'unconfigured'`); synthetic demo fixtures are shown **only** when the user enables *Demo Fixtures*.
