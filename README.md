# 🌿 BreatheWise AI

### Understand Your Air. Protect Your Family. Breathe Better.

**BreatheWise AI** is a privacy-conscious, local-first Family Air Protection Intelligence Platform that transforms environmental air-quality data into personalized family protection plans, explainable recommendations, and smarter daily activity decisions.

Instead of simply displaying an AQI number, BreatheWise AI considers environmental conditions, household preferences, family age groups, and daily routines to help families make more informed decisions about outdoor activities.

**Know your air. Understand your risks. Plan your day better.**

---

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
| Demo Fixture | Clearly identified demonstration data |
| Unavailable | No valid observation available |

The platform does not intentionally disguise demo data, historical observations, or modeled forecasts as live station measurements.

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
- No API key required for the local demonstration mode.
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
git clone https://github.com/YOUR-USERNAME/BreatheWise-AI.git
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


## 🚧 Production Deployment Status

This repository is undergoing production hardening. **The public Render deployment has not yet been updated with this branch and must not be used for real family data.**

The hardening branch now implements anonymous browser-workspace isolation:
- A cryptographically random 256-bit session token is issued in an HttpOnly, Secure (production), SameSite=Lax cookie.
- Only a SHA-256 token hash is stored in SQLite; session records expire after 30 days.
- Each new browser session receives a distinct household. All household CRUD, bootstrap, history, and scenario operations resolve the household through the verified session rather than selecting a global active household.
- Unsafe production API requests require a same-origin HTTPS Origin header.
- Production no longer seeds the shared demo household on startup; synthetic fixtures remain disabled by default.

This is **browser-session isolation, not account authentication**. There is no email/password login, account recovery, cross-device sync, or user identity verification. Clearing browser cookies can make an anonymous workspace inaccessible.

**Durable persistence remains a release blocker for the current free Render deployment.** Its filesystem is ephemeral, so SQLite data can be lost after restart or redeploy. Do not rely on the public deployment for durable personal data. A durable database is needed before enabling real production use; no existing unrelated Supabase project has been connected or modified.

The branch has passed GitHub Actions type-check, automated tests, and production build for commit `b2cb6fc4` (45 tests). Live CPCB/OpenAQ provider coverage, deployed-browser workflows, accessibility automation, backup/restore, and durable production persistence still require verification. Do not describe the public deployment as production-ready until those release blockers are closed.

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

Choose and add an appropriate open-source license before publishing this repository as an open-source project. Provider datasets and external services remain subject to their respective licenses and terms.

---

**BreatheWise AI — Understand Your Air. Protect Your Family. Breathe Better.**
