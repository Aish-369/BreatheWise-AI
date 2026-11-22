import fs from 'node:fs';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { generateProtectionPlan } from '../src/engine/intelligence';
import { buildDemoFixtures } from '../src/server/adapters/fixtures';
import { createApp } from '../src/server/app';
import {
  createBrowserSession,
  createHouseholdForBrowserSession,
  getActiveHousehold,
  getBrowserSession,
  getDb,
  hashSessionToken,
  getSchemaVersion,
  listImportedForecasts,
  listLocations,
  listMembers,
  listPlanEvidence,
  listPlanHistory,
  listPlanRecommendations,
  listRoutines,
  saveForecastSlots,
  savePlanHistory,
  saveSnapshot,
  seedDemoHouseholdIfEmpty,
} from '../src/server/db';
import { runMigrations } from '../src/server/migrations';

const tempDirs: string[] = [];
const openDbs: DatabaseSync[] = [];
const openServers: http.Server[] = [];

function createTempDbPath(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'breathewise-phase1-'));
  tempDirs.push(dir);
  return path.join(dir, 'test.db');
}

async function startTestServer(db: DatabaseSync): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const app = createApp(db);
  const server = await new Promise<http.Server>((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
  });
  openServers.push(server);
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

afterEach(async () => {
  while (openServers.length > 0) {
    const srv = openServers.pop()!;
    await new Promise<void>((resolve) => {
      srv.close(() => resolve());
    });
  }
  while (openDbs.length > 0) {
    const db = openDbs.pop()!;
    try {
      db.close();
    } catch {
      // already closed
    }
  }
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Phase 1 — Versioned SQLite Migrations & Normalized Evidence Storage', () => {
  it('migrates a populated pre-v2 SQLite database non-destructively while preserving all rows', () => {
    const dbPath = createTempDbPath();
    const legacyDb = new DatabaseSync(dbPath);
    const now = '2026-11-20T09:00:00.000Z';

    // Simulate pre-Phase-1 7-table schema with live existing data
    legacyDb.exec(`
      CREATE TABLE households (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        locality TEXT DEFAULT '',
        language TEXT NOT NULL DEFAULT 'en',
        is_demo_profile INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE family_members (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        name TEXT NOT NULL,
        age_group TEXT NOT NULL,
        activity_preference TEXT NOT NULL,
        routine_flexibility TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE activity_routines (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        title TEXT NOT NULL,
        environment TEXT NOT NULL,
        flexibility TEXT NOT NULL,
        preferred_window TEXT NOT NULL,
        member_ids_json TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE environmental_snapshots (
        id TEXT PRIMARY KEY, provider TEXT NOT NULL, provider_label TEXT NOT NULL,
        data_type TEXT NOT NULL, city TEXT NOT NULL, location_label TEXT NOT NULL,
        station_or_grid_id TEXT NOT NULL, spatial_resolution_note TEXT NOT NULL,
        pollutants_json TEXT NOT NULL, reported_aqi_india REAL, measured_at TEXT,
        retrieved_at TEXT NOT NULL, freshness TEXT NOT NULL, license_attribution TEXT NOT NULL,
        warnings_json TEXT NOT NULL, is_demo_fixture INTEGER NOT NULL DEFAULT 0,
        is_available INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE cams_forecasts (
        id TEXT PRIMARY KEY, city TEXT NOT NULL, time_window TEXT NOT NULL,
        forecast_date TEXT NOT NULL, expected_pm25 REAL, expected_pm10 REAL,
        expected_aqi_india REAL, trend TEXT NOT NULL, data_type TEXT NOT NULL DEFAULT 'forecast',
        provider_label TEXT NOT NULL, grid_resolution_note TEXT NOT NULL,
        issued_at TEXT NOT NULL, license_attribution TEXT NOT NULL,
        is_demo_fixture INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE protection_plans (
        id TEXT PRIMARY KEY, household_id TEXT NOT NULL, city TEXT NOT NULL,
        generated_at TEXT NOT NULL, aqi_value REAL, aqi_band TEXT NOT NULL,
        freshness TEXT NOT NULL, is_demo_fixture INTEGER NOT NULL DEFAULT 0,
        plan_json TEXT NOT NULL
      );
      CREATE TABLE scenario_runs (
        id TEXT PRIMARY KEY, household_id TEXT NOT NULL, created_at TEXT NOT NULL,
        label TEXT NOT NULL, result_json TEXT NOT NULL
      );
    `);

    legacyDb
      .prepare(
        `INSERT INTO households (id, name, city, locality, language, is_demo_profile, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('hh-legacy-1', 'Kulkarni Family', 'Pune', 'Kothrud', 'mr', 0, now, now);

    legacyDb
      .prepare(
        `INSERT INTO family_members (id, household_id, name, age_group, activity_preference, routine_flexibility, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run('mem-legacy-1', 'hh-legacy-1', 'Meera', 'older_adult', 'morning_walk', 'flexible', now);

    legacyDb
      .prepare(
        `INSERT INTO activity_routines (id, household_id, title, environment, flexibility, preferred_window, member_ids_json, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        'rt-legacy-1',
        'hh-legacy-1',
        'Morning Temple Walk',
        'outdoor',
        'flexible',
        '06:00-09:00',
        JSON.stringify(['mem-legacy-1']),
        'Pre-existing note',
        now
      );

    legacyDb
      .prepare(
        `INSERT INTO protection_plans (id, household_id, city, generated_at, aqi_value, aqi_band, freshness, is_demo_fixture, plan_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run('plan-legacy-1', 'hh-legacy-1', 'Pune', now, 118, 'moderate', 'fresh', 1, '{"id":"plan-legacy-1"}');

    legacyDb.close();

    // Open through getDb() to trigger versioned migrations
    const db = getDb(dbPath);
    openDbs.push(db);

    expect(getSchemaVersion(db)).toBe(6);
    // Idempotency check
    expect(runMigrations(db)).toBe(6);

    const household = getActiveHousehold(db);
    expect(household?.id).toBe('hh-legacy-1');
    expect(household?.name).toBe('Kulkarni Family');
    expect(household?.language).toBe('mr');

    const members = listMembers(db, 'hh-legacy-1');
    expect(members).toHaveLength(1);
    expect(members[0].name).toBe('Meera');

    const routines = listRoutines(db, 'hh-legacy-1');
    expect(routines).toHaveLength(1);
    expect(routines[0].title).toBe('Morning Temple Walk');

    const plans = db.prepare('SELECT id FROM protection_plans WHERE household_id = ?').all('hh-legacy-1');
    expect(plans).toHaveLength(1);

    // Non-destructively backfilled tables
    const settingsRow = db
      .prepare('SELECT * FROM user_settings WHERE household_id = ?')
      .get('hh-legacy-1') as Record<string, unknown>;
    expect(settingsRow.language).toBe('mr');
    expect(settingsRow.default_city).toBe('Pune');

    const locations = listLocations(db, 'hh-legacy-1');
    expect(locations.length).toBeGreaterThanOrEqual(2);
    expect(locations.find((l) => l.city === 'Pune')?.isPrimary).toBe(true);

    // Check added updated_at columns and indexes
    const memberCols = db.prepare('PRAGMA table_info(family_members)').all() as Array<{ name: string }>;
    expect(memberCols.some((c) => c.name === 'updated_at')).toBe(true);

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'")
      .all() as Array<{ name: string }>;
    expect(indexes.length).toBeGreaterThanOrEqual(9);
  });

  it('archives plans together with normalized recommendations and plan_evidence rows', () => {
    const dbPath = createTempDbPath();
    const db = getDb(dbPath);
    openDbs.push(db);

    const hh = seedDemoHouseholdIfEmpty(db);
    const fixtures = buildDemoFixtures();
    const puneSnap = fixtures.snapshots.find((s) => s.city === 'Pune')!;
    saveSnapshot(db, puneSnap);

    const plan = generateProtectionPlan({
      household: hh,
      members: listMembers(db, hh.id),
      routines: listRoutines(db, hh.id),
      primarySnapshot: puneSnap,
      forecastSlots: fixtures.forecasts,
    });

    savePlanHistory(db, hh.id, plan, puneSnap.id);

    const history = listPlanHistory(db, hh.id);
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(plan.id);

    const recs = listPlanRecommendations(db, plan.id);
    expect(recs.length).toBe(plan.recommendations.length);
    expect(recs[0].householdId).toBe(hh.id);

    const evidence = listPlanEvidence(db, plan.id);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].snapshotId).toBe(puneSnap.id);
    expect(evidence[0].providerLabel).toBe(plan.supportingEvidence.providerLabel);
  });
});

describe('Phase 1 — Express API CRUD, Validation & Centralized Error Handling (Real Temp SQLite)', () => {
  it('supports PUT /api/members/:id, PUT /api/routines/:id, Locations CRUD, Settings GET/PUT, Providers, and structured error JSON', async () => {
    const dbPath = createTempDbPath();
    const db = getDb(dbPath);
    openDbs.push(db);
    seedDemoHouseholdIfEmpty(db);

    const { baseUrl } = await startTestServer(db);

    // 1. Health check includes schemaVersion
    const healthRes = await fetch(`${baseUrl}/api/health`);
    expect(healthRes.status).toBe(200);
    const healthJson = (await healthRes.json()) as { ok: boolean; schemaVersion: number };
    expect(healthJson.ok).toBe(true);
    expect(healthJson.schemaVersion).toBe(6);

    // 2. Bootstrap exposes locations & settings without breaking existing contract
    const bootRes = await fetch(`${baseUrl}/api/bootstrap?simulateOutage=false&useFixtures=true&persist=true`);
    expect(bootRes.status).toBe(200);
    const bootJson = (await bootRes.json()) as {
      household: { id: string; city: string };
      members: Array<{ id: string; name: string }>;
      routines: Array<{ id: string; title: string }>;
      locations: Array<{ id: string; city: string; isPrimary: boolean }>;
      settings: { language: string; useDemoFixtures: boolean; simulateOutage: boolean; defaultCity: string };
      plan: { id: string };
    };
    expect(bootJson.members.length).toBe(4);
    expect(bootJson.locations.length).toBe(2);
    expect(bootJson.settings.defaultCity).toBe('Pune');

    // 3. PUT /api/members/:id updates member cleanly
    const targetMemberId = bootJson.members[0].id;
    const putMemberRes = await fetch(`${baseUrl}/api/members/${targetMemberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Updated',
        ageGroup: 'school_child',
        activityPreference: 'outdoor_play',
        routineFlexibility: 'fixed',
      }),
    });
    expect(putMemberRes.status).toBe(200);
    const putMemberJson = (await putMemberRes.json()) as {
      member: { id: string; name: string; routineFlexibility: string };
    };
    expect(putMemberJson.member.name).toBe('Aarav Updated');
    expect(putMemberJson.member.routineFlexibility).toBe('fixed');

    // Missing member returns 404 JSON
    const missingMemberRes = await fetch(`${baseUrl}/api/members/mem-does-not-exist`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ghost',
        ageGroup: 'adult',
        activityPreference: 'commute',
        routineFlexibility: 'fixed',
      }),
    });
    expect(missingMemberRes.status).toBe(404);
    const missingMemberJson = (await missingMemberRes.json()) as { error: string; code: string };
    expect(missingMemberJson.code).toBe('NOT_FOUND');

    // Invalid member payload returns 400 VALIDATION_ERROR without stack traces
    const invalidMemberRes = await fetch(`${baseUrl}/api/members/${targetMemberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', ageGroup: 'invalid_group' }),
    });
    expect(invalidMemberRes.status).toBe(400);
    const invalidMemberText = await invalidMemberRes.text();
    expect(invalidMemberText).toContain('VALIDATION_ERROR');
    expect(invalidMemberText).not.toContain('node_modules');

    // 4. PUT /api/routines/:id updates routine and validates member ownership
    const targetRoutineId = bootJson.routines[0].id;
    const putRoutineRes = await fetch(`${baseUrl}/api/routines/${targetRoutineId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Morning Commute',
        environment: 'outdoor',
        flexibility: 'flexible',
        preferredWindow: '09:00-12:00',
        memberIds: [targetMemberId],
        notes: 'Updated window',
      }),
    });
    expect(putRoutineRes.status).toBe(200);
    const putRoutineJson = (await putRoutineRes.json()) as {
      routine: { title: string; preferredWindow: string };
    };
    expect(putRoutineJson.routine.title).toBe('Updated Morning Commute');
    expect(putRoutineJson.routine.preferredWindow).toBe('09:00-12:00');

    // Reject routine referencing unknown member ID
    const badMemberRoutineRes = await fetch(`${baseUrl}/api/routines/${targetRoutineId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Bad Routine',
        environment: 'outdoor',
        flexibility: 'fixed',
        preferredWindow: '06:00-09:00',
        memberIds: ['mem-nonexistent'],
      }),
    });
    expect(badMemberRoutineRes.status).toBe(400);
    const badMemberRoutineJson = (await badMemberRoutineRes.json()) as { code: string };
    expect(badMemberRoutineJson.code).toBe('BAD_REQUEST');

    // 5. Locations CRUD (/api/locations)
    const createLocRes = await fetch(`${baseUrl}/api/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Mumbai',
        locality: 'Bandra West',
        label: 'Mumbai · Bandra West',
        isPrimary: true,
        latitude: 19.0596,
        longitude: 72.8295,
      }),
    });
    expect(createLocRes.status).toBe(201);
    const createLocJson = (await createLocRes.json()) as {
      location: { id: string; city: string; isPrimary: boolean };
      locations: Array<{ id: string; city: string; isPrimary: boolean }>;
    };
    expect(createLocJson.location.isPrimary).toBe(true);
    expect(createLocJson.locations.filter((l) => l.isPrimary)).toHaveLength(1);
    expect(createLocJson.locations.find((l) => l.city === 'Pune')?.isPrimary).toBe(false);

    // Update Mumbai location
    const updateLocRes = await fetch(`${baseUrl}/api/locations/${createLocJson.location.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Mumbai',
        locality: 'Dadar',
        label: 'Mumbai · Dadar',
        isPrimary: true,
        latitude: 19.0178,
        longitude: 72.8478,
      }),
    });
    expect(updateLocRes.status).toBe(200);
    const updateLocJson = (await updateLocRes.json()) as { location: { locality: string } };
    expect(updateLocJson.location.locality).toBe('Dadar');

    // Delete primary Mumbai location -> falls back to promoting another saved location
    const delLocRes = await fetch(`${baseUrl}/api/locations/${createLocJson.location.id}`, {
      method: 'DELETE',
    });
    expect(delLocRes.status).toBe(200);
    const delLocJson = (await delLocRes.json()) as {
      locations: Array<{ id: string; city: string; isPrimary: boolean }>;
    };
    expect(delLocJson.locations.some((l) => l.isPrimary)).toBe(true);

    // Deleting missing location returns 404
    const delMissingLocRes = await fetch(`${baseUrl}/api/locations/loc-missing`, {
      method: 'DELETE',
    });
    expect(delMissingLocRes.status).toBe(404);

    // 6. Settings GET/PUT persists across requests and drives bootstrap defaults
    const putSettingsRes = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'mr',
        useDemoFixtures: false,
        simulateOutage: true,
        defaultCity: 'Pune',
      }),
    });
    expect(putSettingsRes.status).toBe(200);

    const getSettingsRes = await fetch(`${baseUrl}/api/settings`);
    expect(getSettingsRes.status).toBe(200);
    const getSettingsJson = (await getSettingsRes.json()) as {
      settings: { language: string; useDemoFixtures: boolean; simulateOutage: boolean };
    };
    expect(getSettingsJson.settings.language).toBe('mr');
    expect(getSettingsJson.settings.simulateOutage).toBe(true);

    const outageBootRes = await fetch(`${baseUrl}/api/bootstrap`);
    expect(outageBootRes.status).toBe(200);
    const outageBootJson = (await outageBootRes.json()) as {
      environment: { mode: string };
      household: { language: string };
    };
    expect(outageBootJson.environment.mode).toBe('unavailable');
    expect(outageBootJson.household.language).toBe('mr');

    // 7. Providers registry endpoint
    const providersRes = await fetch(`${baseUrl}/api/providers`);
    expect(providersRes.status).toBe(200);
    const providersJson = (await providersRes.json()) as {
      providers: Array<{ id: string; licenses: Array<{ licenseName: string }> }>;
    };
    expect(providersJson.providers.map((p) => p.id)).toEqual(['cams_manual', 'cpcb', 'openaq']);
    expect(providersJson.providers.every((p) => p.licenses.length >= 1)).toBe(true);

    // 8. Unknown API route returns JSON 404 + malformed JSON returns 400
    const unknownApiRes = await fetch(`${baseUrl}/api/non-existent-endpoint`);
    expect(unknownApiRes.status).toBe(404);
    const unknownApiJson = (await unknownApiRes.json()) as { code: string };
    expect(unknownApiJson.code).toBe('ROUTE_NOT_FOUND');

    const badJsonRes = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"language":',
    });
    expect(badJsonRes.status).toBe(400);
    const badJsonBody = (await badJsonRes.json()) as { code: string };
    expect(badJsonBody.code).toBe('INVALID_JSON');

    // 9. Routine daily completion toggle (PATCH /api/routines/:id/completion)
    const completeRes = await fetch(`${baseUrl}/api/routines/${targetRoutineId}/completion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    expect(completeRes.status).toBe(200);
    const completeJson = (await completeRes.json()) as {
      routine: { completedDate: string | null };
    };
    expect(completeJson.routine.completedDate).toBe(new Date().toISOString().slice(0, 10));

    const postCompleteBoot = await fetch(`${baseUrl}/api/bootstrap`);
    const postCompleteJson = (await postCompleteBoot.json()) as {
      plan: { dailyPlan: Array<{ routineId: string; completedToday?: boolean }> };
    };
    expect(
      postCompleteJson.plan.dailyPlan.find((d) => d.routineId === targetRoutineId)?.completedToday
    ).toBe(true);

    // 10. PUT /api/household persists non-medical sensitivityTags + security headers check
    const hhRes = await fetch(`${baseUrl}/api/household`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deshmukh Verified',
        city: 'Pune',
        locality: 'Kothrud',
        language: 'en',
        sensitivityTags: ['dust_sensitive', 'early_commute_exposure'],
      }),
    });
    expect(hhRes.status).toBe(200);
    expect(hhRes.headers.get('x-content-type-options')).toBe('nosniff');
    expect(hhRes.headers.get('x-frame-options')).toBe('DENY');
    expect(hhRes.headers.get('referrer-policy')).toBe('no-referrer');
    const hhJson = (await hhRes.json()) as {
      household: { name: string; sensitivityTags: string[] };
    };
    expect(hhJson.household.sensitivityTags).toEqual([
      'dust_sensitive',
      'early_commute_exposure',
    ]);
  });

  it('migrates a populated v2 database through v6 non-destructively with household forecast isolation', () => {
    const dbPath = createTempDbPath();
    const v2Db = new DatabaseSync(dbPath);
    const now = '2026-11-21T07:00:00.000Z';

    v2Db.exec(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);
      CREATE TABLE households (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, locality TEXT DEFAULT '',
        language TEXT NOT NULL DEFAULT 'en', is_demo_profile INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE family_members (
        id TEXT PRIMARY KEY, household_id TEXT NOT NULL, name TEXT NOT NULL,
        age_group TEXT NOT NULL, activity_preference TEXT NOT NULL, routine_flexibility TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE activity_routines (
        id TEXT PRIMARY KEY, household_id TEXT NOT NULL, title TEXT NOT NULL,
        environment TEXT NOT NULL, flexibility TEXT NOT NULL, preferred_window TEXT NOT NULL,
        member_ids_json TEXT NOT NULL, notes TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE saved_locations (
        id TEXT PRIMARY KEY, household_id TEXT NOT NULL, city TEXT NOT NULL, locality TEXT DEFAULT '',
        label TEXT NOT NULL, is_primary INTEGER NOT NULL DEFAULT 0, latitude REAL, longitude REAL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE user_settings (
        household_id TEXT PRIMARY KEY, language TEXT NOT NULL DEFAULT 'en',
        use_demo_fixtures INTEGER NOT NULL DEFAULT 1, simulate_outage INTEGER NOT NULL DEFAULT 0,
        default_city TEXT NOT NULL DEFAULT 'Pune', updated_at TEXT NOT NULL
      );
      CREATE TABLE environmental_snapshots (
        id TEXT PRIMARY KEY, provider TEXT NOT NULL, provider_label TEXT NOT NULL,
        data_type TEXT NOT NULL, city TEXT NOT NULL, location_label TEXT NOT NULL,
        station_or_grid_id TEXT NOT NULL, spatial_resolution_note TEXT NOT NULL,
        pollutants_json TEXT NOT NULL, reported_aqi_india REAL, measured_at TEXT,
        retrieved_at TEXT NOT NULL, freshness TEXT NOT NULL, license_attribution TEXT NOT NULL,
        warnings_json TEXT NOT NULL, is_demo_fixture INTEGER NOT NULL DEFAULT 0,
        is_available INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE cams_forecasts (
        id TEXT PRIMARY KEY, city TEXT NOT NULL, time_window TEXT NOT NULL,
        forecast_date TEXT NOT NULL, expected_pm25 REAL, expected_pm10 REAL,
        expected_aqi_india REAL, trend TEXT NOT NULL, data_type TEXT NOT NULL DEFAULT 'forecast',
        provider_label TEXT NOT NULL, grid_resolution_note TEXT NOT NULL,
        issued_at TEXT NOT NULL, license_attribution TEXT NOT NULL,
        is_demo_fixture INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE protection_plans (
        id TEXT PRIMARY KEY, household_id TEXT NOT NULL, city TEXT NOT NULL,
        generated_at TEXT NOT NULL, aqi_value REAL, aqi_band TEXT NOT NULL,
        freshness TEXT NOT NULL, is_demo_fixture INTEGER NOT NULL DEFAULT 0,
        plan_json TEXT NOT NULL
      );
      CREATE TABLE recommendations (
        id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, household_id TEXT NOT NULL,
        title_key TEXT NOT NULL, severity TEXT NOT NULL, category TEXT NOT NULL,
        applicable_members_json TEXT NOT NULL, suggested_action_key TEXT NOT NULL,
        reason_generated_key TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE plan_evidence (
        id TEXT PRIMARY KEY, plan_id TEXT NOT NULL, snapshot_id TEXT,
        provider_label TEXT NOT NULL, station_or_grid_id TEXT NOT NULL, data_type TEXT NOT NULL,
        freshness TEXT NOT NULL, measured_at TEXT, aqi_value REAL, aqi_is_derived INTEGER NOT NULL DEFAULT 0,
        is_demo_fixture INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
      );
      CREATE TABLE scenario_runs (
        id TEXT PRIMARY KEY, household_id TEXT NOT NULL, created_at TEXT NOT NULL,
        label TEXT NOT NULL, result_json TEXT NOT NULL
      );
      CREATE TABLE data_providers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1, notes TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE license_attributions (
        id TEXT PRIMARY KEY, provider_id TEXT NOT NULL, license_name TEXT NOT NULL,
        attribution_text TEXT NOT NULL, license_url TEXT NOT NULL DEFAULT '', commercial_use_allowed INTEGER NOT NULL DEFAULT 1
      );
    `);

    v2Db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
      1,
      '001_initial_schema',
      now
    );
    v2Db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
      2,
      '002_normalized_entities_locations_settings_providers',
      now
    );
    v2Db.prepare(
      `INSERT INTO households (id, name, city, locality, language, is_demo_profile, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run('hh-v2', 'Joshi Family', 'Nagpur', 'Dharampeth', 'hi', 0, now, now);

    v2Db.prepare(
      `INSERT INTO environmental_snapshots (id, provider, provider_label, data_type, city, location_label, station_or_grid_id, spatial_resolution_note, pollutants_json, reported_aqi_india, measured_at, retrieved_at, freshness, license_attribution, warnings_json, is_demo_fixture, is_available)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      'snap-v2',
      'cpcb',
      'CPCB',
      'physical_station',
      'Nagpur',
      'Civil Lines',
      'CPCB-NGP-1',
      'Station',
      '{"pm25":52}',
      92,
      now,
      now,
      'fresh',
      'GODL',
      '[]',
      0,
      1
    );
    v2Db.close();

    const db = getDb(dbPath);
    openDbs.push(db);
    expect(getSchemaVersion(db)).toBe(6);

    const hh = getActiveHousehold(db);
    expect(hh?.name).toBe('Joshi Family');
    expect(hh?.sensitivityTags).toEqual([]);

    const snapRow = db
      .prepare('SELECT classification FROM environmental_snapshots WHERE id = ?')
      .get('snap-v2') as { classification: string };
    expect(snapRow.classification).toBe('verified_live');
  });

  it('enforces SQLite PRAGMA foreign_keys = ON, rejects orphan children, and cascades deletes cleanly', () => {
    const dbPath = createTempDbPath();
    const db = getDb(dbPath);
    openDbs.push(db);

    const fkRow = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(fkRow.foreign_keys).toBe(1);

    const hh = seedDemoHouseholdIfEmpty(db);
    const now = new Date().toISOString();

    // Reject orphan child referencing missing household
    expect(() => {
      db.prepare(
        `INSERT INTO family_members (id, household_id, name, age_group, activity_preference, routine_flexibility, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('mem-orphan', 'hh-nonexistent', 'Orphan', 'adult', 'commute', 'fixed', now, now);
    }).toThrow(/FOREIGN KEY/i);

    // Save snapshot + plan + evidence, then verify ON DELETE SET NULL on snapshot and ON DELETE CASCADE on household
    const fixtures = buildDemoFixtures();
    const puneSnap = fixtures.snapshots.find((s) => s.city === 'Pune')!;
    saveSnapshot(db, puneSnap);
    const plan = generateProtectionPlan({
      household: hh,
      members: listMembers(db, hh.id),
      routines: listRoutines(db, hh.id),
      primarySnapshot: puneSnap,
      forecastSlots: fixtures.forecasts,
    });
    savePlanHistory(db, hh.id, plan, puneSnap.id);

    db.prepare('DELETE FROM environmental_snapshots WHERE id = ?').run(puneSnap.id);
    const evAfterSnapDelete = listPlanEvidence(db, plan.id);
    expect(evAfterSnapDelete).toHaveLength(1);
    expect(evAfterSnapDelete[0].snapshotId).toBeNull();

    db.prepare('DELETE FROM households WHERE id = ?').run(hh.id);
    expect(listMembers(db, hh.id)).toHaveLength(0);
    expect(listRoutines(db, hh.id)).toHaveLength(0);
    expect(listLocations(db, hh.id)).toHaveLength(0);
    expect(listPlanRecommendations(db, plan.id)).toHaveLength(0);
    expect(db.prepare('SELECT household_id FROM user_settings WHERE household_id = ?').all(hh.id)).toHaveLength(0);
  });
});


describe('Production safety — local maintenance endpoints', () => {
  it('blocks global demo reset and data clearing in production', async () => {
    const db = getDb(createTempDbPath());
    openDbs.push(db);
    const household = seedDemoHouseholdIfEmpty(db);
    const { baseUrl } = await startTestServer(db);
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const resetResponse = await fetch(`${baseUrl}/api/local/reset-demo`, { method: 'POST' });
      expect(resetResponse.status).toBe(403);
      expect((await resetResponse.json()).code).toBe('LOCAL_MAINTENANCE_DISABLED');

      const clearResponse = await fetch(`${baseUrl}/api/local/clear`, { method: 'DELETE' });
      expect(clearResponse.status).toBe(403);
      expect((await clearResponse.json()).code).toBe('LOCAL_MAINTENANCE_DISABLED');

      const remaining = db.prepare('SELECT id FROM households').all() as Array<{ id: string }>;
      expect(remaining.map((row) => row.id)).toContain(household.id);
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
});


describe('Production safety — fail-closed household API boundary', () => {
  it('does not expose the shared legacy household through public production routes', async () => {
    const db = getDb(createTempDbPath());
    openDbs.push(db);
    seedDemoHouseholdIfEmpty(db);
    const { baseUrl } = await startTestServer(db);
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const bootstrap = await fetch(`${baseUrl}/api/bootstrap`);
      expect(bootstrap.status).toBe(401);
      expect((await bootstrap.json()).code).toBe('SESSION_REQUIRED');

      const members = await fetch(`${baseUrl}/api/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Unauthorized', ageGroup: 'adult', activityPreference: 'commute', routineFlexibility: 'fixed' }) });
      expect(members.status).toBe(401);
      expect((await members.json()).code).toBe('SESSION_REQUIRED');

      const health = await fetch(`${baseUrl}/api/health`);
      expect(health.status).toBe(200);
      const providers = await fetch(`${baseUrl}/api/providers`);
      expect(providers.status).toBe(200);
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
});


describe('Production browser session isolation', () => {
  it('creates independent HttpOnly sessions and scopes writes to each household', async () => {
    const db = getDb(createTempDbPath());
    openDbs.push(db);
    const { baseUrl } = await startTestServer(db);
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const first = await fetch(`${baseUrl}/api/session`);
      expect(first.status).toBe(201);
      const firstCookie = first.headers.get('set-cookie')?.split(';')[0];
      expect(firstCookie).toBeTruthy();
      expect(first.headers.get('set-cookie')).toContain('HttpOnly');
      expect(first.headers.get('set-cookie')).toContain('SameSite=Lax');
      expect(first.headers.get('set-cookie')).toContain('Secure');
      const firstBody = await first.json() as { household: { id: string } };

      const second = await fetch(`${baseUrl}/api/session`);
      expect(second.status).toBe(201);
      const secondCookie = second.headers.get('set-cookie')?.split(';')[0];
      const secondBody = await second.json() as { household: { id: string } };
      expect(secondBody.household.id).not.toBe(firstBody.household.id);

      const add = await fetch(`${baseUrl}/api/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: firstCookie!,
          Origin: new URL(baseUrl).origin.replace('http:', 'https:'),
        },
        body: JSON.stringify({
          name: 'Private Member',
          ageGroup: 'adult',
          activityPreference: 'commute',
          routineFlexibility: 'fixed',
        }),
      });
      expect(add.status).toBe(201);
      const inserted = db.prepare('SELECT household_id FROM family_members WHERE name = ?')
        .get('Private Member') as { household_id: string };
      expect(inserted.household_id).toBe(firstBody.household.id);
      expect(inserted.household_id).not.toBe(secondBody.household.id);

      const blocked = await fetch(`${baseUrl}/api/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: firstCookie!,
          Origin: 'https://attacker.example',
        },
        body: JSON.stringify({
          name: 'Cross Site',
          ageGroup: 'adult',
          activityPreference: 'commute',
          routineFlexibility: 'fixed',
        }),
      });
      expect(blocked.status).toBe(403);
      expect((await blocked.json()).code).toBe('CSRF_ORIGIN_REJECTED');
      expect(db.prepare('SELECT id FROM family_members WHERE name = ?').all('Cross Site')).toHaveLength(0);

      const secondMembers = db.prepare('SELECT id FROM family_members WHERE household_id = ?')
        .all(secondBody.household.id);
      expect(secondMembers).toHaveLength(0);
      expect(secondCookie).toBeTruthy();
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
});

describe('Household browser session storage', () => {
  it('stores only a token hash and resolves a valid unexpired session', () => {
    const db = getDb(createTempDbPath());
    openDbs.push(db);
    const household = seedDemoHouseholdIfEmpty(db);
    const token = 'test-session-token-that-is-never-stored-raw';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    createBrowserSession(db, token, household.id, expiresAt);
    const stored = db.prepare('SELECT token_hash, household_id FROM app_sessions').get() as { token_hash: string; household_id: string };
    expect(stored.token_hash).toBe(hashSessionToken(token));
    expect(stored.token_hash).not.toBe(token);
    expect(stored.household_id).toBe(household.id);
    expect(getBrowserSession(db, token)).toEqual({ householdId: household.id, expiresAt });
  });

  it('rejects expired and unknown browser session tokens', () => {
    const db = getDb(createTempDbPath());
    openDbs.push(db);
    const household = seedDemoHouseholdIfEmpty(db);
    createBrowserSession(db, 'expired-token', household.id, '2000-01-01T00:00:00.000Z');
    expect(getBrowserSession(db, 'expired-token')).toBeNull();
    expect(getBrowserSession(db, 'unknown-token')).toBeNull();
  });
});


describe('Household-scoped imported forecast storage', () => {
  it('keeps a household uploaded forecast private from other browser sessions', () => {
    const db = getDb(createTempDbPath());
    openDbs.push(db);
    const first = createHouseholdForBrowserSession(db);
    const second = createHouseholdForBrowserSession(db);
    const fixture = buildDemoFixtures().forecasts[0];
    saveForecastSlots(db, fixture.city, [fixture], first.id);

    expect(listImportedForecasts(db, fixture.city, first.id).some((slot) => slot.id === fixture.id)).toBe(true);
    expect(listImportedForecasts(db, fixture.city, second.id).some((slot) => slot.id === fixture.id)).toBe(false);
  });
});
