import { describe, expect, it } from 'vitest';
import { parseCamsImport } from '../src/server/adapters/camsImporter';
import { buildDemoFixtureForCity, buildDemoFixtures } from '../src/server/adapters/fixtures';
import {
  addMember,
  clearAllLocalData,
  deleteMember,
  deleteRoutine,
  getActiveHousehold,
  getDb,
  listImportedForecasts,
  listMembers,
  listPlanHistory,
  listRoutines,
  saveForecastSlots,
  savePlanHistory,
  seedDemoHouseholdIfEmpty,
  upsertHousehold,
  upsertRoutine,
} from '../src/server/db';
import { generateProtectionPlan } from '../src/engine/intelligence';

describe('SQLite Persistence & CAMS Importer Integration', () => {
  it('creates deterministic, explicitly labelled demo AQI and forecast data for cities without fixtures', () => {
    const now = '2026-11-22T08:00:00.000Z';
    const first = buildDemoFixtureForCity('Nashik', now);
    const second = buildDemoFixtureForCity('Nashik', now);

    expect(first.snapshot.city).toBe('Nashik');
    expect(first.snapshot.classification).toBe('demo_fixture');
    expect(first.snapshot.isDemoFixture).toBe(true);
    expect(first.snapshot.isAvailable).toBe(true);
    expect(first.snapshot.measuredAt).toBe(now);
    expect(first.snapshot.warnings.join(' ')).toContain('NOT LIVE MEASUREMENTS');
    expect(first.snapshot.reportedAqiIndia).toBe(second.snapshot.reportedAqiIndia);
    expect(first.forecasts).toHaveLength(5);
    expect(first.forecasts.every((slot) => slot.isDemoFixture)).toBe(true);
    expect(first.forecasts.every((slot) => slot.providerLabel.includes('Demo'))).toBe(true);
  });

  it('23. validates and parses CAMS CSV and JSON forecast payloads and rejects invalid rows', () => {
    const csv = `city,grid_id,issued_at,forecast_date,time_window,expected_pm25,expected_pm10,trend
Pune,CAMS-0.4,2026-11-20T08:00:00Z,2026-11-21,06:00-09:00,72,130,worsening
Pune,CAMS-0.4,2026-11-20T08:00:00Z,2026-11-21,12:00-16:00,40,80,improving`;
    const parsedCsv = parseCamsImport(csv);
    expect(parsedCsv.ok).toBe(true);
    expect(parsedCsv.slots?.length).toBe(2);
    expect(parsedCsv.slots?.[0].dataType).toBe('forecast');
    expect(parsedCsv.slots?.[0].licenseAttribution).toContain('Copernicus');

    const bad = parseCamsImport('city,time_window,expected_pm25\nPune,25:00-26:00,-5');
    expect(bad.ok).toBe(false);
  });

  it('24. executes complete SQLite CRUD, plan archiving, and local data deletion', () => {
    const db = getDb(':memory:');
    const hh = seedDemoHouseholdIfEmpty(db);
    expect(hh.city).toBe('Pune');
    expect(listMembers(db, hh.id).length).toBe(4);

    // Update household
    const updatedHh = upsertHousehold(
      db,
      { name: 'Patil Family', city: 'Ahilyanagar', locality: 'Savedi', language: 'mr' },
      false
    );
    expect(updatedHh.city).toBe('Ahilyanagar');
    expect(updatedHh.language).toBe('mr');

    // Add & delete member
    const added = addMember(db, hh.id, {
      name: 'Riya',
      ageGroup: 'infant_toddler',
      activityPreference: 'mostly_indoors',
      routineFlexibility: 'flexible',
    });
    expect(listMembers(db, hh.id).some((m) => m.id === added.id)).toBe(true);
    deleteMember(db, hh.id, added.id);
    expect(listMembers(db, hh.id).some((m) => m.id === added.id)).toBe(false);

    // Add & delete routine
    const rt = upsertRoutine(db, hh.id, {
      title: 'Evening cycling',
      environment: 'outdoor',
      flexibility: 'flexible',
      preferredWindow: '16:00-19:00',
      memberIds: [listMembers(db, hh.id)[0].id],
    });
    expect(listRoutines(db, hh.id).some((r) => r.id === rt.id)).toBe(true);
    deleteRoutine(db, hh.id, rt.id);
    expect(listRoutines(db, hh.id).some((r) => r.id === rt.id)).toBe(false);

    // Store CAMS forecast
    const cams = parseCamsImport(
      `city,grid_id,issued_at,forecast_date,time_window,expected_pm25\nAhilyanagar,CAMS-0.4,2026-11-21T08:00:00Z,2026-11-22,12:00-16:00,34`
    );
    expect(cams.ok).toBe(true);
    saveForecastSlots(db, 'Ahilyanagar', cams.slots!);
    expect(listImportedForecasts(db, 'Ahilyanagar').length).toBe(1);

    // Generate and archive plan
    const fixtures = buildDemoFixtures();
    const ahnFixture = fixtures.snapshots.find((s) => s.city === 'Ahilyanagar')!;
    const plan = generateProtectionPlan({
      household: updatedHh,
      members: listMembers(db, hh.id),
      routines: listRoutines(db, hh.id),
      primarySnapshot: ahnFixture,
      forecastSlots: listImportedForecasts(db, 'Ahilyanagar'),
    });
    savePlanHistory(db, hh.id, plan);
    expect(listPlanHistory(db, hh.id).length).toBe(1);

    // Clear all local data
    clearAllLocalData(db);
    expect(getActiveHousehold(db)).toBeNull();
    db.close();
  });
});
