# Gemini plan explanation

## Purpose

BreatheWise keeps environmental calculations and recommendations deterministic. Gemini provides a bounded natural-language explanation of the plan that the rules engine has already produced. It cannot calculate AQI, alter recommendations, or replace unavailable evidence.

## Runtime configuration

Set these variables on the Express server only:

- `GEMINI_API_KEY`: API key created in Google AI Studio.
- `GEMINI_MODEL`: optional model override; default `gemini-3.8-flash`.

For Render, open the BreatheWise web service → **Environment** → add the variables → save changes. Keep the key out of Git, frontend variables, screenshots, and chat messages. The repository's `.env.example` contains no secret values.

## Request and privacy boundary

The browser sends a validated explanation context containing:

- AQI band/value, freshness, data type, demo/live classification, PM2.5 and PM10 (no city field).
- Counts of household age groups.
- At most four existing recommendations with translated titles, actions, reasons, and evidence metrics.

City, member names, household names, free-text routine notes, and sensitivity tags are not included. The server validates the body with Zod and applies a separate 8-request/15-minute IP limit to `/api/ai/*`.

The server calls Google's Gemini Interactions API with `store: false`, a 12-second timeout, a bounded output budget, and a server-only `x-goog-api-key` header. The key is never returned to the client or logged. `store: false` controls interaction storage; it does not change Google's separate free-tier data-use terms. Google's pricing documentation says free-tier content may be used to improve products, while paid-tier content is not. Review current provider terms before enabling real household data.

## Safety and fallback

The prompt treats the context as untrusted data and instructs Gemini to:

- Explain only the supplied plan and evidence; do not add or change actions.
- Never invent or alter AQI, pollutant values, units, timestamps, locations, or time windows.
- Clearly identify demo fixtures and unavailable/stale data.
- Avoid diagnosis, prescriptions, treatment advice, ozone generators, and unsafe DIY air cleaners.

If the API key is absent, the provider times out, or Gemini returns an invalid response, the endpoint returns a translated rules-based explanation. The deterministic plan remains visible and authoritative in every case.

## Verification

1. Run `npm run typecheck`, `npm run lint`, `npm run test:coverage`, and `npm run build`.
2. With no `GEMINI_API_KEY`, open Planner and confirm the rules-based explanation and configuration notice appear.
3. Set a valid key only in the server environment, restart/redeploy, and generate an explanation in English, Marathi, and Hindi.
4. Confirm browser network responses contain explanation text but never the API key.
5. Test provider failure and verify the rules-based fallback remains usable.
