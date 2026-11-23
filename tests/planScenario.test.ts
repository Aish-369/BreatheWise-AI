import { describe, expect, it } from 'vitest';
import {
  applyForecastOverrides,
  applyRoutineOverrides,
  buildScenarioSnapshot,
  computeScenarioComparison,
} from '../src/engine/plan/scenario';
import type { EngineInput } from '../src/engine/plan/types';
import { generateProtectionPlan } from '../src/engine/intelligence';
import type {
  ActivityRoutine,
  EnvironmentalSnapshot,
  ForecastSlot,
  HouseholdProfile,
} from '../src/shared/types';

const NOW = '2026-11-22T09:00:00.000Z';

const household: HouseholdProfile = {
  id: 'hh-scen',
  name: 'Scenario Household',
  city: 'Pune',
  locality: 'Kothrud',
  language: 'mr',
  isDemoProfile: false,
  createdAt: NOW,
  updatedAt: NOW,
};

const baseRoutines: ActivityRoutine[] = [
  {
    id: 'r1',
    householdId: 'hh-scen',
    title: 'Morning Walk',
    environment: 'outdoor',
    flexibility: 'flexible',
    preferredWindow: '06:00-09:00',
    memberIds: [],
    createdAt: NOW,
  },
];

const baseForecasts: ForecastSlot[] = [
  {
    id: 'f1',
    city: 'Pune',
    timeWindow: '06:00-09:00',
    forecastDate: '2026-11-22',
    expectedPm25: 60,
    expectedPm10: 100,
    expectedAqiIndia: 110,
    trend: 'stable',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: '40km',
    issuedAt: NOW,
    licenseAttribution: 'CAMS',
    isDemoFixture: false,
  },
  {
    id: 'f2',
    city: 'Pune',
    timeWindow: '12:00-16:00',
    forecastDate: '2026-11-22',
    expectedPm25: 55,
    expectedPm10: 95,
    expectedAqiIndia: 98,
    trend: 'stable',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: '40km',
    issuedAt: NOW,
    licenseAttribution: 'CAMS',
    isDemoFixture: false,
  },
];

describe('engine/plan/scenario', () => {
  it('builds synthetic snapshot when baseline is null and applies pollutant + stale overrides', () => {
    const baseInput: EngineInput = {
      household,
      members: [],
      routines: baseRoutines,
      primarySnapshot: null,
    };

    const synthetic = buildScenarioSnapshot(
      baseInput,
      { label: 'Synthetic', pm25Override: 150, pm10Override: 210, simulateStale: true },
      NOW
    );
    expect(synthetic.id).toBe('scenario-synthetic');
    expect(synthetic.dataType).toBe('hypothetical_scenario');
    expect(synthetic.pollutants.pm25).toBe(150);
    expect(synthetic.pollutants.pm10).toBe(210);
    expect(synthetic.freshness).toBe('stale');

    const unavailable = buildScenarioSnapshot(
      baseInput,
      { label: 'Outage', simulateUnavailable: true },
      NOW
    );
    expect(unavailable.isAvailable).toBe(false);
    expect(unavailable.measuredAt).toBeNull();
  });

  it('applies AQI override over existing baseline snapshot without mutating baseline', () => {
    const primary: EnvironmentalSnapshot = {
      id: 'snap-orig',
      provider: 'cpcb',
      providerLabel: 'CPCB',
      dataType: 'physical_station',
      city: 'Pune',
      locationLabel: 'Kothrud',
      stationOrGridId: 'P-1',
      spatialResolutionNote: 'Station',
      pollutants: { pm25: 40, pm10: 80 },
      reportedAqiIndia: 68,
      measuredAt: NOW,
      retrievedAt: NOW,
      freshness: 'fresh',
      licenseAttribution: 'GODL',
      warnings: [],
      isDemoFixture: true,
      isAvailable: true,
    };
    const modSnap = buildScenarioSnapshot(
      { household, members: [], routines: [], primarySnapshot: primary },
      { label: 'Custom AQI', aqiOverride: 340 },
      NOW
    );
    expect(primary.reportedAqiIndia).toBe(68);
    expect(modSnap.reportedAqiIndia).toBe(340);
    expect(modSnap.isDemoFixture).toBe(false);
  });

  it('applies routine overrides and worsening/improving forecast overrides accurately', () => {
    const updatedRoutines = applyRoutineOverrides(baseRoutines, {
      label: 'Shift window',
      overrideRoutineId: 'r1',
      overrideWindow: '16:00-19:00',
      overrideEnvironment: 'indoor',
    });
    expect(updatedRoutines[0].preferredWindow).toBe('16:00-19:00');
    expect(updatedRoutines[0].environment).toBe('indoor');

    const unchanged = applyForecastOverrides(baseForecasts, {
      label: 'None',
      forecastTrendOverride: 'none',
    });
    expect(unchanged).toEqual(baseForecasts);

    const worsening = applyForecastOverrides(baseForecasts, {
      label: 'Worse',
      forecastTrendOverride: 'worsening',
    });
    expect(worsening.every((f) => f.trend === 'worsening' && f.expectedPm25! > 60)).toBe(true);

    const improving = applyForecastOverrides(baseForecasts, {
      label: 'Better',
      forecastTrendOverride: 'improving',
    });
    expect(improving.find((f) => f.timeWindow === '12:00-16:00')?.expectedPm25).toBe(32);
    expect(improving.find((f) => f.timeWindow === '06:00-09:00')?.expectedPm25).toBe(42);
  });

  it('reports no_material_shift when baseline and scenario plans are equivalent', () => {
    const input: EngineInput = {
      household,
      members: [],
      routines: baseRoutines,
      primarySnapshot: null,
      nowIso: NOW,
    };
    const basePlan = generateProtectionPlan(input);
    const samePlan = generateProtectionPlan(input);
    const cmp = computeScenarioComparison(basePlan, samePlan, { label: 'No change' }, NOW);
    expect(cmp.isScenario).toBe(true);
    expect(cmp.changedScheduleCount).toBe(0);
    expect(cmp.changeSummaryKeys).toEqual(['scenario_diff_no_material_shift']);
  });
});
