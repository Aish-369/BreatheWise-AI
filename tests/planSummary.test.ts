import { describe, expect, it } from 'vitest';
import { collectPlanEvidence } from '../src/engine/plan/evidence';
import {
  buildProtectionPlanResult,
  buildUnavailablePlanResult,
  SCENARIO_BANNER,
} from '../src/engine/plan/summary';
import type { EngineInput } from '../src/engine/plan/types';
import type { HouseholdProfile } from '../src/shared/types';

const NOW = '2026-11-22T09:00:00.000Z';

const household: HouseholdProfile = {
  id: 'hh-sum',
  name: 'Summary Household',
  city: 'Nagpur',
  locality: 'Dharampeth',
  language: 'hi',
  isDemoProfile: false,
  createdAt: NOW,
  updatedAt: NOW,
};

describe('engine/plan/summary', () => {
  it('builds unavailable plan results with scenario banner only when isScenario is true', () => {
    const input: EngineInput = {
      household,
      members: [],
      routines: [],
      primarySnapshot: null,
      isScenario: false,
    };
    const bundle = collectPlanEvidence(input, NOW);
    const liveUnavailable = buildUnavailablePlanResult(input, bundle, 'v2.2.0', [], []);
    expect(liveUnavailable.isAvailable).toBe(false);
    expect(liveUnavailable.aqiBand).toBe('unavailable');
    expect(liveUnavailable.summaryKey).toBe('summary_unavailable');
    expect(liveUnavailable.scenarioLabel).toBeUndefined();
    expect(liveUnavailable.ruleSetVersion).toBe('v2.2.0');

    const scenarioUnavailable = buildUnavailablePlanResult(
      { ...input, isScenario: true },
      bundle,
      'v2.2.0',
      [],
      []
    );
    expect(scenarioUnavailable.isScenario).toBe(true);
    expect(scenarioUnavailable.scenarioLabel).toBe(SCENARIO_BANNER);
  });

  it('builds populated available plan result preserving band, conflict, and summary params', () => {
    const input: EngineInput = {
      household,
      members: [
        {
          id: 'm1',
          householdId: 'hh-sum',
          name: 'Kiran',
          ageGroup: 'adult',
          activityPreference: 'commute',
          routineFlexibility: 'fixed',
          createdAt: NOW,
        },
      ],
      routines: [],
      primarySnapshot: {
        id: 's-1',
        provider: 'cpcb',
        providerLabel: 'CPCB Nagpur',
        dataType: 'physical_station',
        city: 'Nagpur',
        locationLabel: 'Civil Lines',
        stationOrGridId: 'NGP-1',
        spatialResolutionNote: 'Station',
        pollutants: { pm25: 65, pm10: 115 },
        reportedAqiIndia: 122,
        measuredAt: '2026-11-22T08:30:00.000Z',
        retrievedAt: NOW,
        freshness: 'fresh',
        licenseAttribution: 'GODL',
        warnings: [],
        isDemoFixture: true,
        isAvailable: true,
      },
      isScenario: true,
    };
    const bundle = collectPlanEvidence(input, NOW);
    const plan = buildProtectionPlanResult(input, bundle, 'v2.2.0', [], []);
    expect(plan.isAvailable).toBe(true);
    expect(plan.aqiValue).toBe(122);
    expect(plan.aqiBand).toBe('moderate');
    expect(plan.summaryKey).toBe('summary_moderate');
    expect(plan.summaryParams).toEqual({ city: 'Nagpur', aqi: 122, memberCount: 1 });
    expect(plan.isDemoFixture).toBe(true);
    expect(plan.scenarioLabel).toBe(SCENARIO_BANNER);
  });
});
