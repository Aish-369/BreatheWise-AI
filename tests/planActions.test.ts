import { describe, expect, it } from 'vitest';
import {
  buildAllRecommendations,
  buildUnavailableRecommendation,
} from '../src/engine/plan/actions';
import { collectPlanEvidence } from '../src/engine/plan/evidence';
import { groupHouseholdMembers } from '../src/engine/plan/riskScoring';
import type { EngineInput } from '../src/engine/plan/types';
import type { EnvironmentalSnapshot, FamilyMember, HouseholdProfile } from '../src/shared/types';

const NOW = '2026-11-22T10:00:00.000Z';

const household: HouseholdProfile = {
  id: 'hh-act',
  name: 'Action Household',
  city: 'Pune',
  locality: 'Kothrud',
  language: 'en',
  isDemoProfile: false,
  createdAt: NOW,
  updatedAt: NOW,
};

const members: FamilyMember[] = [
  {
    id: 'm1',
    householdId: 'hh-act',
    name: 'Vikram',
    ageGroup: 'adult',
    activityPreference: 'outdoor_exercise',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
];

function makeSnapshot(overrides: Partial<EnvironmentalSnapshot> = {}): EnvironmentalSnapshot {
  return {
    id: 's1',
    provider: 'cpcb',
    providerLabel: 'CPCB Station',
    dataType: 'physical_station',
    city: 'Pune',
    locationLabel: 'Kothrud',
    stationOrGridId: 'STN-1',
    spatialResolutionNote: 'Station',
    pollutants: { pm25: 20, pm10: 35 },
    reportedAqiIndia: 40,
    measuredAt: '2026-11-22T09:30:00.000Z',
    retrievedAt: NOW,
    freshness: 'fresh',
    licenseAttribution: 'GODL',
    warnings: [],
    isDemoFixture: false,
    isAvailable: true,
    ...overrides,
  };
}

describe('engine/plan/actions', () => {
  it('builds unavailable safeguard recommendation with accurate household context', () => {
    const input: EngineInput = {
      household,
      members,
      routines: [],
      primarySnapshot: null,
    };
    const bundle = collectPlanEvidence(input, NOW);
    const rec = buildUnavailableRecommendation(input, bundle, ['Vikram']);
    expect(rec.id).toBe('rec-unavailable');
    expect(rec.severity).toBe('unavailable');
    expect(rec.confidenceOrLimitationKey).toBe('evidence_unavailable');
    expect(rec.evidenceTrail?.householdContext).toContain('1 household member(s) in Pune');
  });

  it('builds open-ventilation and good band guidance when AQI is Good', () => {
    const input: EngineInput = {
      household,
      members,
      routines: [],
      primarySnapshot: makeSnapshot(),
    };
    const bundle = collectPlanEvidence(input, NOW);
    const recs = buildAllRecommendations(input, bundle, groupHouseholdMembers(members));
    expect(recs.find((r) => r.id === 'rec-household-general')?.severity).toBe('nominal');
    expect(recs.find((r) => r.id === 'rec-household-general')?.reconsiderWhenKey).toBe(
      'reconsider_when_aqi_rises'
    );
    expect(recs.some((r) => r.id === 'rec-ventilation-open')).toBe(true);
  });

  it('adds stale, conflict, historical worsening (>= 15 PM2.5), and limited ventilation warnings together', () => {
    const stalePrimary = makeSnapshot({
      measuredAt: '2026-11-22T01:00:00.000Z',
      pollutants: { pm25: 190, pm10: 260 },
      reportedAqiIndia: 355,
    });
    const prevSnapshot = makeSnapshot({
      id: 's-prev',
      measuredAt: '2026-11-21T20:00:00.000Z',
      pollutants: { pm25: 120, pm10: 190 },
      reportedAqiIndia: 240,
    });
    const conflictSecondary = makeSnapshot({
      id: 's-sec',
      providerLabel: 'Secondary',
      pollutants: { pm25: 45, pm10: 80 },
      reportedAqiIndia: 75,
    });

    const input: EngineInput = {
      household,
      members,
      routines: [],
      primarySnapshot: stalePrimary,
      secondarySnapshots: [conflictSecondary],
      historicalSnapshots: [prevSnapshot],
    };
    const bundle = collectPlanEvidence(input, NOW);
    const recs = buildAllRecommendations(input, bundle, groupHouseholdMembers(members));
    const ids = recs.map((r) => r.id);

    expect(ids).toContain('rec-stale-warning');
    expect(ids).toContain('rec-conflict');
    expect(ids).toContain('rec-historical-worsening');
    expect(ids).toContain('rec-ventilation-limit');
    expect(recs.find((r) => r.id === 'rec-ventilation-limit')?.severity).toBe('caution');
  });
});
