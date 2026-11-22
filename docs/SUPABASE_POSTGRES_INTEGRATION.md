# BreatheWise AI — Supabase PostgreSQL Integration Status

Last verified: 2026-11-22
Supabase project: `batvqlnhpujyqyeeikmv` (Mumbai, PostgreSQL 17)

## Provisioned
- Dedicated BreatheWise AI Supabase project is active.
- Initial PostgreSQL schema applied and verified.
- Core tables exist for households, members, routines, locations, settings, sessions, providers, licenses, snapshots, forecasts, plans, recommendations, evidence, scenarios, and schema migrations.
- Schema migration versions 1–6 are recorded in public.schema_migrations.
- RLS is enabled on every application table, including migration metadata.
- No client-facing RLS policies exist yet. This is deliberately deny-by-default; do not add permissive policies just to silence the Supabase advisor.
- Missing foreign-key indexes identified by the performance advisor have been added.
- Generated TypeScript database definitions are in src/server/supabase/database.types.ts.

## Critical integration status
**The Express application is not connected to PostgreSQL yet.** src/server/db.ts uses Node's synchronous node:sqlite DatabaseSync API. PostgreSQL access through pg or PostgREST is asynchronous. Replacing a connection string or adding environment variables alone will not migrate the application.

A proper integration requires:
1. Introduce a PostgreSQL repository implementation with parameterized SQL and transaction support.
2. Convert synchronous database call chains and callers to async safely.
3. Preserve household scoping for every read/write, including session lookup, forecasts, history, and plan evidence.
4. Keep database credentials server-only; never put them in Vite/client variables.
5. Add PostgreSQL integration tests for session isolation, CRUD, transactions, and persistence.
6. Run the full test suite and production build before switching production traffic.

## Deployment safeguards
- Do not point Render at PostgreSQL until the async repository refactor and integration tests pass.
- Do not remove SQLite yet; it remains the local-development/test adapter.
- Do not automatically copy production household data. The new database currently contains schema and provider/license reference rows only; no household records were migrated.
- Do not create broad USING (true) RLS policies. The app authenticates anonymous browser sessions in Express, not with Supabase Auth JWTs. If the backend uses a server-only credential that bypasses RLS, enforce household ownership in backend queries and keep the credential private. If moving to end-user JWT/RLS later, design and test identity mapping first.
- Render Free deployment is not durable until the app is connected to PostgreSQL and restart/redeploy persistence is tested.

## Required deployment secrets
The Render service will need a server-only PostgreSQL connection string (or server-only Supabase service credential) after the repository refactor. Obtain it from the Supabase dashboard Connect panel and configure it in Render environment settings. Never commit it, paste it into source code, or expose it with a VITE_ prefix.

The available tools did not expose the database password/connection URI or allow configuring Render environment variables. No credentials have been generated, displayed, or committed.

## Verification
After repository integration, run npm run lint, npm test, and npm run build. Then verify that separate browser sessions cannot access each other's household data and that households, routines, plans, scenarios, and imported forecasts survive restart/redeploy. Confirm no credential appears in browser bundles, API responses, logs, or Git history.