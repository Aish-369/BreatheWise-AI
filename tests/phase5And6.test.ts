import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateProtectionPlan,
  RULE_SET_VERSION,
} from '../src/engine/intelligence';
import {
  analyzeHistoricalTrend,
  assessLocationComparisonCompatibility,
  classifySnapshotTier,
} from '../src/engine/quality';
import { DICTS } from '../src/i18n/translations';
import { parseCamsImport } from '../src/server/adapters/camsImporter';
import {
  clearCpcbCache,
  fetchCpcbSnapshots,
  parseCpcbTimestamp,
} from '../src/server/adapters/cpcb';
import {
  clearOpenAqCache,
  fetchOpenAqSnapshots,
} from '../src/server/adapters/openaq';
import {
  getDb,
  listCitySnapshots,
  saveSnapshot,
} from '../src/server/db';
import { findCityMetadata, searchIndianCities } from '../src/shared/indianCities';
import type {
  ActivityRoutine,
  EnvironmentalSnapshot,
  FamilyMember,
  HouseholdProfile,
} from '../src/shared/types';
import { buildPdfReportModel } from '../src/utils/pdfExport';

const NOW = '2026-11-21T08:00:00.000Z';
const ONE_HOUR_AGO = '2026-11-21T07:00:00.000Z';
const TWO_HOURS_AGO = '2026-11-21T06:00:00.000Z';
const EIGHT_HOURS_AGO = '2026-11-21T00:00:00.000Z';

const baseHousehold: HouseholdProfile = {
  id: 'hh-test',
  name: 'Deshmukh Household',
  city: 'Pune',
  locality: 'Kothrud',
  language: 'en',
  isDemoProfile: false,
  sensitivityTags: [],
  createdAt: NOW,
  updatedAt: NOW,
};

const baseMembers: FamilyMember[] = [
  {
    id: 'm1',
    householdId: 'hh-test',
    name: 'Aarav',
    ageGroup: 'school_child',
    activityPreference: 'outdoor_play',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
  {
    id: 'm2',
    householdId: 'hh-test',
    name: 'Sunanda',
    ageGroup: 'older_adult',
    activityPreference: 'morning_walk',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
];

const baseRoutines: ActivityRoutine[] = [
  {
    id: 'r1',
    householdId: 'hh-test',
    title: 'Morning Walk',
    environment: 'outdoor',
    flexibility: 'flexible',
    preferredWindow: '06:00-09:00',
    memberIds: ['m2'],
    createdAt: NOW,
  },
];

function makeSnap(overrides: Partial<EnvironmentalSnapshot> = {}): EnvironmentalSnapshot {
  return {
    id: 'snap-base',
    provider: 'openaq',
    providerLabel: 'OpenAQ API v3',
    dataType: 'physical_station',
    city: 'Pune',
    locationLabel: 'Shivajinagar',
    stationOrGridId: 'STN-100',
    spatialResolutionNote: 'Station point',
    pollutants: { pm25: 55, pm10: 95, no2: 42, o3: 48 },
    reportedAqiIndia: 98,
    measuredAt: ONE_HOUR_AGO,
    retrievedAt: NOW,
    freshness: 'fresh',
    licenseAttribution: 'Open License',
    warnings: [],
    isDemoFixture: false,
    isAvailable: true,
    ...overrides,
  };
}

const originalFetch = globalThis.fetch;
const originalOpenAqKey = process.env.OPENAQ_API_KEY;
const originalDataGovKey = process.env.DATA_GOV_IN_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOpenAqKey === undefined) delete process.env.OPENAQ_API_KEY;
  else process.env.OPENAQ_API_KEY = originalOpenAqKey;
  if (originalDataGovKey === undefined) delete process.env.DATA_GOV_IN_API_KEY;
  else process.env.DATA_GOV_IN_API_KEY = originalDataGovKey;
  clearOpenAqCache();
  clearCpcbCache();
  vi.restoreAllMocks();
});

describe('Phase 5 & 6 — Provenance Tiers, Intelligence v2, Adapters, DB & Localization Parity', () => {
  it('classifies all 5 snapshot data provenance tiers deterministically', () => {
    expect(classifySnapshotTier(null, 'unavailable')).toBe('unavailable');
    expect(classifySnapshotTier(makeSnap({ isAvailable: false }), 'fresh')).toBe('unavailable');
    expect(
      classifySnapshotTier(makeSnap({ provider: 'demo_fixture', isDemoFixture: true }), 'fresh')
    ).toBe('demo_fixture');
    expect(
      classifySnapshotTier(makeSnap({ dataType: 'forecast' }), 'fresh')
    ).toBe('forecast_only');
    expect(classifySnapshotTier(makeSnap(), 'stale')).toBe('historical_observation');
    expect(classifySnapshotTier(makeSnap(), 'fresh')).toBe('verified_live');
    expect(classifySnapshotTier(makeSnap(), 'aging')).toBe('verified_live');
  });

  it('triggers pollutant-specific, sensitivity-tag, trend, and explainability rules in Intelligence v2.0.0', () => {
    expect(RULE_SET_VERSION).toBe('2.0.0');

    const prevHist = makeSnap({
      id: 'snap-hist-1',
      measuredAt: TWO_HOURS_AGO,
      pollutants: { pm25: 40, pm10: 85 },
    });
    const current = makeSnap({
      id: 'snap-cur-1',
      measuredAt: ONE_HOUR_AGO,
      reportedAqiIndia: 165,
      pollutants: { pm25: 78, pm10: 145, no2: 96, o3: 118 },
    });

    const plan = generateProtectionPlan({
      household: {
        ...baseHousehold,
        sensitivityTags: ['dust_sensitive', 'respiratory_comfort', 'early_commute_exposure'],
      },
      members: baseMembers,
      routines: baseRoutines,
      primarySnapshot: current,
      historicalSnapshots: [prevHist],
      nowIso: NOW,
    });

    expect(plan.ruleSetVersion).toBe('2.0.0');
    expect(plan.historicalTrend?.direction).toBe('worsening');
    expect(plan.historicalTrend?.deltaPm25).toBe(38);

    const recIds = plan.recommendations.map((r) => r.id);
    expect(recIds).toContain('rec-pollutant-no2');
    expect(recIds).toContain('rec-pollutant-o3');
    expect(recIds).toContain('rec-sens-dust');
    expect(recIds).toContain('rec-sens-respiratory');
    expect(recIds).toContain('rec-sens-commute');
    expect(recIds).toContain('rec-historical-worsening');

    for (const rec of plan.recommendations) {
      expect(rec.evidenceTrail).toBeDefined();
      expect(rec.evidenceTrail?.ruleTriggered).toBeTruthy();
      expect(rec.evidenceTrail?.evidenceMetric).toBeTruthy();
      expect(rec.evidenceTrail?.householdContext).toBeTruthy();
    }

    // Coarse dust rule fires when PM10 > 100 while PM2.5 remains <= 60
    const coarseDustPlan = generateProtectionPlan({
      household: baseHousehold,
      members: baseMembers,
      routines: baseRoutines,
      primarySnapshot: makeSnap({
        reportedAqiIndia: 135,
        pollutants: { pm25: 45, pm10: 155 },
      }),
      nowIso: NOW,
    });
    expect(coarseDustPlan.recommendations.map((r) => r.id)).toContain('rec-pollutant-dust');
  });

  it('assesses location comparison compatibility honestly across mixed tiers, time skew, and missing pollutants', () => {
    const liveA = makeSnap({
      city: 'Pune',
      measuredAt: ONE_HOUR_AGO,
      pollutants: { pm25: 55, pm10: 95, no2: 40, o3: 45 },
    });
    const demoB = makeSnap({
      city: 'Ahilyanagar',
      provider: 'demo_fixture',
      isDemoFixture: true,
      measuredAt: EIGHT_HOURS_AGO,
      pollutants: { pm25: 48, pm10: 88 },
    });

    const compat = assessLocationComparisonCompatibility(liveA, demoB, NOW);
    expect(compat.compatible).toBe(false);
    expect(compat.warningKeys).toContain('comp_warn_mixed_tiers');
    expect(compat.warningKeys).toContain('comp_warn_timestamp_skew');
    expect(compat.warningKeys).toContain('comp_warn_partial_pollutants');

    const missing = assessLocationComparisonCompatibility(liveA, null, NOW);
    expect(missing.compatible).toBe(false);
    expect(missing.warningKeys).toContain('comp_warn_missing_coverage');
  });

  it('deduplicates identical timestamps when analyzing historical PM2.5 trends', () => {
    const s1 = makeSnap({ id: 'h1', measuredAt: TWO_HOURS_AGO, pollutants: { pm25: 50 } });
    const s1Dup = makeSnap({ id: 'h1-dup', measuredAt: TWO_HOURS_AGO, pollutants: { pm25: 50 } });
    const s2 = makeSnap({ id: 'h2', measuredAt: ONE_HOUR_AGO, pollutants: { pm25: 35 } });

    expect(analyzeHistoricalTrend([s1], 'Pune', s1Dup)).toBeNull();
    const improving = analyzeHistoricalTrend([s1, s1Dup], 'Pune', s2);
    expect(improving?.direction).toBe('improving');
    expect(improving?.deltaPm25).toBe(-15);
    expect(improving?.sampleCount).toBe(2);
  });

  it('validates OpenAQ v3 locations + latest endpoints, bounds checks, retry and TTL caching', async () => {
    process.env.OPENAQ_API_KEY = 'test-openaq-key';
    const freshUtc = new Date(Date.now() - 20 * 60 * 1000).toISOString();

    let fetchCalls = 0;
    globalThis.fetch = vi.fn(async (input) => {
      fetchCalls += 1;
      const url = String(input);
      if (fetchCalls === 1) {
        return new Response('Rate limited', {
          status: 429,
          headers: { 'retry-after': '0' },
        });
      }
      if (url.includes('/locations?')) {
        return new Response(
          JSON.stringify({
            results: [
              {
                id: 777,
                name: 'Shivajinagar Station',
                locality: 'Pune',
                coordinates: { latitude: 18.53, longitude: 73.85 },
                datetimeLast: { utc: freshUtc },
                sensors: [
                  { id: 1, parameter: { name: 'pm25' } },
                  { id: 2, parameter: { name: 'pm10' } },
                  { id: 3, parameter: { name: 'temperature' } },
                  { id: 4, parameter: { name: 'relativehumidity' } },
                  { id: 5, parameter: { name: 'wind_speed' } },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          results: [
            { sensorsId: 1, value: 64.2, datetime: { utc: freshUtc } },
            { sensorsId: 2, value: 99999, datetime: { utc: freshUtc } },
            { sensorsId: 3, value: 26.5, datetime: { utc: freshUtc } },
            { sensorsId: 4, value: 48, datetime: { utc: freshUtc } },
            { sensorsId: 5, value: 2.3, datetime: { utc: freshUtc } },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const first = await fetchOpenAqSnapshots('Pune');
    expect(fetchCalls).toBe(3); // 429 retry + locations + location latest
    expect(first.status.status).toBe('live');
    expect(first.snapshots).toHaveLength(1);
    expect(first.snapshots[0].pollutants.pm25).toBe(64.2);
    expect(first.snapshots[0].pollutants.pm10).toBeUndefined();
    expect(first.snapshots[0].qualityMetadata?.rejectedFields).toContain('pm10=99999');
    expect(first.snapshots[0].weather).toEqual({
      temperatureC: 26.5,
      relativeHumidityPct: 48,
      windSpeedMs: 2.3,
    });
    expect(first.snapshots[0].qualityMetadata?.fromCache).toBe(false);

    const second = await fetchOpenAqSnapshots('Pune');
    expect(fetchCalls).toBe(3); // served from TTL cache without network call
    expect(second.snapshots[0].qualityMetadata?.fromCache).toBe(true);
  });

  it('validates CPCB adapter: IST timestamp parsing, city alias lookup, bounds checks, and TTL caching', async () => {
    const parsedIso = parseCpcbTimestamp('21-11-2026 08:30:00');
    expect(parsedIso).toBe('2026-11-21T03:00:00.000Z');
    expect(parseCpcbTimestamp('')).toBeNull();

    process.env.DATA_GOV_IN_API_KEY = 'test-datagov-key';
    const freshUtcIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let requestedUrl = '';
    let fetchCalls = 0;

    globalThis.fetch = vi.fn(async (input) => {
      fetchCalls += 1;
      requestedUrl = String(input);
      return new Response(
        JSON.stringify({
          records: [
            {
              station: 'Ahmednagar MPCB',
              city: 'Ahmednagar',
              last_update: freshUtcIso,
              pollutant_id: 'PM2.5',
              avg_value: '58.4',
              latitude: '19.09',
              longitude: '74.74',
            },
            {
              station: 'Ahmednagar MPCB',
              city: 'Ahmednagar',
              last_update: freshUtcIso,
              pollutant_id: 'PM10',
              avg_value: '-12',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as typeof fetch;

    const first = await fetchCpcbSnapshots('Ahilyanagar');
    const parsedCpcbUrl = new URL(requestedUrl);
    expect(parsedCpcbUrl.searchParams.get('filters[city]')).toBe('Ahmednagar');
    expect(parsedCpcbUrl.searchParams.get('filters[state]')).toBe('Maharashtra');
    expect(first.status.status).toBe('live');
    expect(first.snapshots).toHaveLength(1);
    expect(first.snapshots[0].city).toBe('Ahilyanagar');
    expect(first.snapshots[0].pollutants.pm25).toBe(58.4);
    expect(first.snapshots[0].pollutants.pm10).toBeUndefined();
    expect(first.snapshots[0].qualityMetadata?.rejectedFields).toContain('PM10=-12');

    const second = await fetchCpcbSnapshots('Ahilyanagar');
    expect(fetchCalls).toBe(1);
    expect(second.snapshots[0].qualityMetadata?.fromCache).toBe(true);
  });

  it('rejects unsafe or fabricated CAMS import metadata and accepts complete JSON/CSV', () => {
    const formulaRes = parseCamsImport(
      'city,grid_id,issued_at,forecast_date,time_window,expected_pm25\\n=CMD("calc"),CAMS,2026-11-20T08:00:00Z,2026-11-21,06:00-09:00,45'
    );
    expect(formulaRes.ok).toBe(false);
    expect(formulaRes.error).toContain('unsafe formula');

    const missingMetadata = parseCamsImport(
      'city,grid_id,forecast_date,time_window,expected_pm25\\nPune,CAMS,2026-11-21,06:00-09:00,45'
    );
    expect(missingMetadata.ok).toBe(false);
    expect(missingMetadata.error).toContain('issued_at');

    const invalidDate = parseCamsImport(
      'city,grid_id,issued_at,forecast_date,time_window,expected_pm25\\nPune,CAMS,2026-11-20T08:00:00Z,2026-02-30,06:00-09:00,45'
    );
    expect(invalidDate.ok).toBe(false);

    const validJson = parseCamsImport(
      JSON.stringify({
        city: 'Ahmednagar',
        gridId: 'CAMS-0.4',
        issuedAt: NOW,
        slots: [
          {
            forecastDate: '2026-11-21',
            timeWindow: '12:00-16:00',
            expectedPm25: 38,
            expectedPm10: 76,
            trend: 'improving',
          },
        ],
      })
    );
    expect(validJson.ok).toBe(true);
    expect(validJson.city).toBe('Ahilyanagar');
    expect(validJson.slots?.[0].expectedAqiIndia).toBeGreaterThan(0);

    const validCsv = parseCamsImport(
      'city,grid_id,issued_at,forecast_date,time_window,expected_pm25\\nPune,CAMS-0.4,2026-11-20T08:00:00Z,2026-11-21,06:00-09:00,45'
    );
    expect(validCsv.ok).toBe(true);
    expect(validCsv.slots?.[0].trend).toBe('unknown');
    expect(validCsv.slots?.[0].issuedAt).toBe('2026-11-20T08:00:00Z');
  });

  it('deduplicates persisted snapshots in SQLite and queries city history cleanly', () => {
    const db = getDb(':memory:');
    const s1 = makeSnap({ id: 's-1', measuredAt: ONE_HOUR_AGO });
    const s1Dup = makeSnap({ id: 's-1-dup', measuredAt: ONE_HOUR_AGO });
    const s2 = makeSnap({ id: 's-2', measuredAt: TWO_HOURS_AGO });

    saveSnapshot(db, s1);
    saveSnapshot(db, s1Dup);
    saveSnapshot(db, s2);

    const puneSnaps = listCitySnapshots(db, 'Pune', 10);
    expect(puneSnaps).toHaveLength(2);
    db.close();
  });

  it('searches and disambiguates Indian cities accurately', () => {
    const aurangabadMatches = searchIndianCities('Aurangabad');
    expect(aurangabadMatches.some((c) => c.canonicalName === 'Chhatrapati Sambhajinagar')).toBe(true);
    expect(aurangabadMatches.some((c) => c.canonicalName === 'Aurangabad (Bihar)')).toBe(true);
    expect(findCityMetadata('Ahmednagar')?.canonicalName).toBe('Ahilyanagar');
  });

  it('builds localized PDF report models for EN, MR, and HI with Devanagari detection', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: baseMembers,
      routines: baseRoutines,
      primarySnapshot: makeSnap(),
      nowIso: NOW,
    });

    const enModel = buildPdfReportModel(baseHousehold, plan, 'en');
    const mrModel = buildPdfReportModel(baseHousehold, plan, 'mr');
    const hiModel = buildPdfReportModel(baseHousehold, plan, 'hi');

    expect(enModel.containsDevanagari).toBe(false);
    expect(mrModel.containsDevanagari).toBe(true);
    expect(hiModel.containsDevanagari).toBe(true);
    expect(enModel.disclaimer).toContain('not medical advice');
    expect(mrModel.recommendationBlocks.length).toBe(plan.recommendations.length);
  });

  it('maintains 100% key parity across en, mr, and hi and leaves zero missing literal keys in src/', () => {
    const enKeys = Object.keys(DICTS.en).sort();
    const mrKeys = Object.keys(DICTS.mr).sort();
    const hiKeys = Object.keys(DICTS.hi).sort();

    expect(mrKeys).toEqual(enKeys);
    expect(hiKeys).toEqual(enKeys);

    // Check every static string literal passed to t(..., 'key') across src/
    const srcRoot = path.resolve(process.cwd(), 'src');
    const referencedLiteralKeys = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          const content = fs.readFileSync(full, 'utf8');
          const matches = content.matchAll(/\bt\(\s*lang\s*,\s*'([a-zA-Z0-9_]+)'/g);
          for (const m of matches) {
            referencedLiteralKeys.add(m[1]);
          }
        }
      }
    };
    walk(srcRoot);

    const missingKeys = Array.from(referencedLiteralKeys).filter(
      (k) => !(k in DICTS.en)
    );
    expect(missingKeys).toEqual([]);
  });
});
