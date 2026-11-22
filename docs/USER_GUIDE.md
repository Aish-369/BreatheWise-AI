# BreatheWise AI — User Guide

## 1. Quick Start Workflow

1. **Enter Workspace:** Open BreatheWise AI (`http://localhost:3000`) and choose **Open Workspace** or **Set Up Your Family**. Switch between **English**, **मराठी**, and **हिन्दी** anytime from the header or landing page.
2. **Configure Your Family Profile (`Family Profile`):**
   - Select your primary Indian city using the searchable city selector (supports historical/alias names such as *Ahmednagar -> Ahilyanagar* or disambiguating *Aurangabad* across states).
   - Add optional non-medical household considerations (e.g., *Dust & Construction Sensitivity*, *Respiratory Comfort Priority*, *High Outdoor Exertion*, *Elder Mobility Care*, *Early-Morning Commute*).
   - Add, edit, or remove household members (`infant_toddler`, `school_child`, `adult`, `older_adult`) and activity routines (`fixed` vs. `flexible`, indoor vs. outdoor).
3. **Review Daily Actions (`Overview`):**
   - Inspect the current **India CPCB NAQI** gauge, classification badge (`Verified Live`, `Historical Observation`, `Forecast / Coarse Grid`, `Illustrative Sample`, or `Unavailable`), pollutant breakdown, and multi-snapshot historical trend badge.
   - Expand **"Why generated & source evidence"** on any recommendation card to see the exact metric, triggered rule ID, household context, and **"When to Reconsider"** condition.
   - Click **Export PDF** to download a formatted family air brief in English, Marathi, or Hindi.
4. **Manage Today's Schedule (`Daily Planner`):**
   - Filter or review Morning, Afternoon, and Evening windows.
   - Fixed commitments stay intact with protective actions (e.g., cleaner routes or post-commute washup). Flexible outdoor routines automatically propose cleaner time windows *only* when verified CAMS forecast data supports an improvement.
   - Edit routine notes/windows inline, mark routines **Completed Today**, or click **Recalculate Plan**.
5. **Inspect Telemetry & Import CAMS Forecasts (`Air Quality`):**
   - View measured vs. retrieved timestamps, station IDs, coordinates, and ambient weather telemetry when reported.
   - Paste or upload a Copernicus CAMS CSV/JSON forecast under **Import CAMS Forecast** to unlock coarse-grid window comparisons for your city.
   - Toggle **Simulate Outage** or **Illustrative environmental data** in **Settings**. When enabled, clearly labelled synthetic AQI, pollutant and forecast examples fill unsupported city views if live providers return no readings; live readings always take priority.
   - Synthetic sample values are illustrative only, not CPCB/OpenAQ measurements or real CAMS forecasts. They are never presented as verified live data.
6. **Compare Locations (`Locations & Compare`):**
   - Save multiple Indian cities or neighborhoods, set any saved location as Primary, edit labels, and compare any two slots side-by-side with automatic compatibility warnings when mixing tiers, skewed timestamps, or partial sensor coverage.
7. **Run Hypothetical Experiments (`What-If Simulator`):**
   - Test PM2.5, PM10, AQI spikes, moving an outdoor routine indoors, or simulating sensor unavailability. Results are always isolated under the **SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT** banner.
8. **History, Data Export & Privacy (`History & Reports` / `Settings`):**
   - Inspect archived protection plans and scenario runs, re-export historical PDFs, reset the local starter profile, or wipe all local SQLite data permanently.
