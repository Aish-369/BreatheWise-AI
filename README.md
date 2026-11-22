# 🌿 BreatheWise AI

### Understand Your Air. Protect Your Family. Breathe Better.

**BreatheWise AI** is a privacy-conscious, local-first Family Air Protection Intelligence Platform that transforms environmental air-quality data into personalized family protection plans, explainable recommendations, and smarter daily activity decisions.

Instead of simply displaying an AQI number, BreatheWise AI considers environmental conditions, household preferences, family age groups, and daily routines to help families make more informed decisions about outdoor activities.

**Know your air. Understand your risks. Plan your day better.**

---

## 🎯 Chosen Challenge Vertical & Persona

**Vertical:** Family Air-Quality Protection Intelligence.

**Primary persona:** A household coordinator planning outdoor routines for a family that may include school-age children, adults, and older adults. The system uses household-provided age groups, sensitivity preferences, location, and routine flexibility to prioritize understandable, practical actions. It does not infer medical conditions or provide diagnosis.

**Decision approach:** Validate each environmental observation and its provenance first; classify it as verified live, historical, forecast, illustrative sample, or unavailable; evaluate freshness and pollutant evidence; then apply deterministic, versioned rules to household context and routine flexibility. Each recommendation should expose its trigger, evidence, context, and reconsideration condition. If valid evidence is missing, the safe outcome is to hold the recommendation pending data rather than invent a reading.

**Assumptions:** Household details are user-entered and non-medical; external providers may be unavailable or require their own free API credentials; forecast grids are not station observations; hypothetical what-if values are not real measurements; and recommendations are informational rather than medical advice.

## ✨ Why BreatheWise AI?

Most air-quality applications focus on displaying pollution levels.

BreatheWise AI goes further by connecting environmental intelligence with everyday family routines.

It follows a transparent intelligence pipeline:

```text
Environmental Data
        ↓
Data Quality & Validation
        ↓
Source & Timestamp Verification
        ↓
Family & Household Context
        ↓
Deterministic Intelligence Engine
        ↓
Personalized Protection Recommendations
        ↓
Daily Family Protection Plan
```

Every recommendation is designed to be understandable, explainable, and linked to its supporting evidence.

---

## 🚀 Key Features

### 👨‍👩‍👧‍👦 1. Family Protection Intelligence
- Create and manage household profiles.
- Add family members across different age groups.
- Configure optional non-medical household sensitivity preferences.
- Account for fixed and flexible daily routines.
- Generate recommendations based on household context.

### 🌍 2. Air Quality Intelligence
- View environmental air-quality information.
- Inspect pollutant measurements and station details.
- Track observation timestamps and data freshness.
- Integrate supported CPCB and OpenAQ data adapters.
- Import Copernicus CAMS forecast data through CSV or JSON.

### 🧠 3. Explainable Recommendation Engine
- Deterministic, rule-based family protection intelligence.
- Multi-pollutant consideration.
- Household-context-aware recommendations.
- Historical trend awareness.
- Evidence-backed explanations for generated actions.

Each recommendation includes:

- Evidence Metric
- Triggered Rule
- Household Context
- When to Reconsider

### 📅 4. Daily Family Protection Planner
- Organize daily routines into time windows.
- Distinguish fixed and flexible activities.
- Suggest adjustments when supported by suitable data.
- Preserve fixed commitments.
- Edit routines and track completion.

### 🔬 5. What-If Scenario Simulator
- Simulate hypothetical pollution changes.
- Explore PM2.5 and PM10 scenarios.
- Simulate moving outdoor activities indoors.
- Explore unavailable-data and outage situations.

All simulations are explicitly labelled as hypothetical, not observed environmental measurements.

### 📍 6. Location Comparison
- Save multiple locations.
- Compare available environmental information.
- Identify incompatible data sources or timestamps.
- Display comparison warnings when data quality differs.

### 🏠 7. Indoor Protection Guidance
- Access practical indoor air-quality guidance.
- Explore household-oriented protective actions.
- Understand the limitations of available indoor information.

### 🌐 8. Multilingual Experience
Available languages:

- English
- मराठी
- हिन्दी

Localized recommendations and downloadable family protection reports are supported.

### 📄 9. Family Protection PDF Reports
- Generate downloadable reports.
- Export reports in English, Marathi, and Hindi.
- Support Devanagari text rendering.

### 🔐 10. Privacy-First Local Storage
- Local SQLite database.
- Local household and routine persistence.
- No mandatory cloud database.
- No paid AI or LLM API dependency.
- Local data management and reset options.

---

## 🛡️ Data Transparency & Trust

BreatheWise AI distinguishes five environmental data states:

| Classification | Meaning |
|---|---|
| Verified Live | Recent physical station observation |
| Historical Observation | Older physical station observation |
| Forecast / Coarse Grid | Model-based forecast information |
| Illustrative Sample | Clearly identified synthetic reference data, never live measurements |
| Unavailable | No valid observation available |

The platform does not disguise synthetic sample data, historical observations, or modeled forecasts as live station measurements.

**Important:** Forecast estimates are not physical station readings. Coarse-grid forecasts are not equivalent to street-level air-quality measurements or official CPCB AQI.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Backend | Node.js, Express 4 |
| Validation | Zod |
| Database | SQLite |
| Intelligence | Deterministic TypeScript Engine |
| Testing | Vitest |
| PDF Generation | jsPDF |
| Icons | Lucide React |
| Motion | Motion |

---

## 🌱 Zero-Cost & Local-First Approach

BreatheWise AI is designed to run locally without requiring paid AI services or cloud infrastructure.

- No paid AI/LLM API required.
- No mandatory cloud database.
- No paid hosting required for local development.
- No API key required for the local illustrative-data mode.
- Graceful fallback when external providers are unavailable.

Optional external environmental data providers may require free account registration, API keys, internet access, and compliance with their respective terms and licenses.

---

## ⚙️ Getting Started

### Prerequisites

Install the following:

- Node.js 22.x or newer
- npm 10 or newer
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Aish-369/BreatheWise-AI.git
```

### 2. Navigate to the Project

```bash
cd BreatheWise-AI
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

Optional server-side API keys:

```env
OPENAQ_API_KEY=your_openaq_api_key
DATA_GOV_IN_API_KEY=your_data_gov_in_api_key
```

These keys are optional. The application can run without them.

Never expose private API keys through frontend environment variables or commit your `.env` file.

### 5. Start the Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧪 Testing & Quality Checks

Run the following commands:

### TypeScript Type Checking

```bash
npm run lint
```

### Automated Tests

```bash
npm test
```

### Production Build

```bash
npm run build
```

The repository includes automated Vitest suites covering intelligence rules, data adapters, SQLite migrations, API validation, localization, and data-quality behavior. Run the commands above against the exact branch you intend to deploy; a successful build alone does not verify external provider availability or browser workflows.

Interactive browser automation with Playwright is not included in the currently documented verification suite.

---

## 📂 Project Documentation

Detailed documentation is available in the `docs/` directory:

| Document | Description |
|---|---|
| `ARCHITECTURE.md` | System architecture and database design |
| `DATA_SOURCES.md` | Environmental providers, data classification and licensing |
| `TESTING.md` | Automated testing and verification |
| `USER_GUIDE.md` | Application usage and workflows |
| `RELEASE_NOTES.md` | Version history and release information |

---


## 🚧 Deployment & Production Limitations

The public Render deployment is a hosted evaluation instance, not a durable production service. The current application runtime uses local SQLite (`node:sqlite`). Render Free instances have ephemeral local storage, so household data may be lost on restart or redeploy. **Do not enter sensitive or important family information in the hosted instance.**

The current mainline includes anonymous browser-workspace isolation:
- A cryptographically random 256-bit session token is issued in an HttpOnly, Secure (production), SameSite=Lax cookie.
- Only a SHA-256 token hash is stored in SQLite; session records expire after 30 days.
- Each new browser session receives a distinct household. All household CRUD, bootstrap, history, scenario operations, and user-imported CAMS forecasts resolve through the verified session rather than selecting a global active household.
- Unsafe production API requests require a same-origin HTTPS Origin header.
- Production responses include a restrictive Content Security Policy, HSTS, security headers, and no-store API caching.
- Production no longer seeds the shared starter household on startup; synthetic fixtures remain disabled by default.

This is **browser-session isolation, not account authentication**. There is no email/password login, account recovery, cross-device sync, or user identity verification. Clearing browser cookies can make an anonymous workspace inaccessible.

**Durable persistence remains a release blocker for the current free Render deployment.** Its filesystem is ephemeral, so SQLite data can be lost after restart or redeploy. Do not rely on the public deployment for durable personal data. A durable database is needed before enabling real production use; no existing unrelated Supabase project has been connected or modified.

Earlier GitHub Actions runs passed type-checking, automated tests, and the production build for their respective commits. These results do not establish that every current runtime workflow, live provider, or hosted database integration has been verified. Re-run the checks on the exact final commit before submission. Live CPCB/OpenAQ provider coverage, deployed-browser workflows, accessibility automation, backup/restore, and durable production persistence still require verification. Do not describe the public deployment as production-ready until those release blockers are closed.

## ⚠️ Important Disclaimer

BreatheWise AI is an environmental awareness and daily activity planning platform.

It is not a medical device, diagnostic system, or substitute for professional medical advice.

It does not diagnose diseases, prescribe clinical interventions, or guarantee that any location or activity is safe.

Recommendations depend on the quality, freshness, availability, and limitations of the underlying environmental data.

---

## 🎯 Project Vision

Our vision is to make environmental intelligence more understandable and actionable for everyday households.

We believe air-quality information should do more than display numbers. It should help people understand their environment, make informed decisions, and plan their daily activities with greater awareness.

**From Air Quality Data to Family Protection Intelligence.**

---

## 📜 License

This repository does not currently declare an open-source license. Unless a license file is added, all rights remain reserved by the copyright holder; provider datasets and external services remain subject to their respective licenses and terms.

---

**BreatheWise AI — Understand Your Air. Protect Your Family. Breathe Better.**
