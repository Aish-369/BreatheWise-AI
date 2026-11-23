import { describe, expect, it } from 'vitest';
import {
  buildSupportingEvidence,
  collectPlanEvidence,
  collectPlanLimitations,
} from '../src/engine/plan/evidence';
import type { EngineInput } from '../src/engine/plan/types';
import type { EnvironmentalSnapshot, ForecastSlot, HouseholdProfile } from '../src/shared/types';

const NOW = '2026-11-22T09:00:00.000Z';

const baseHousehold: HouseholdProfile = {
  id: 'hh-ev',
  name: 'Evidence Family',
  city: 'Pune',
  locality: 'Shivajinagar',
  language: 'en',
  isDemoProfile: false,
  createdAt: NOW,
  updatedAt: NOW,
};

function makeSnapshot(overrides: Partial<EnvironmentalSnapshot> = {}): EnvironmentalSnapshot {
  return {
    id: 'snap-ev',
    provider: 'cpcb',
    providerLabel: 'CPCB Shivajinagar',
    dataType: 'physical_station',
    city: 'Pune',
    locationLabel: 'Shivajinagar',
    stationOrGridId: 'CPCB-PNQ-1',
    spatialResolutionNote: 'Station monitor',
    pollutants: { pm25: 55, pm10: 95 },
    reportedAqiIndia: 98,
    measuredAt: '2026-11-22T08:30:00.000Z',
    retrievedAt: NOW,
    freshness: 'fresh',
    licenseAttribution: 'GODL India',
    warnings: [],
    isDemoFixture: false,
    isAvailable: true,
    ...overrides,
  };
}

function makeForecast(city: string, window: ForecastSlot['timeWindow']): ForecastSlot {
  return {
    id: `f-${city}-${window}`,
    city,
    timeWindow: window,
    forecastDate: '2026-11-22',
    expectedPm25: 42,
    expectedPm10: 80,
    expectedAqiIndia: 72,
    trend: 'improving',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: '40km grid',
    issuedAt: NOW,
    licenseAttribution: 'Copernicus CAMS',
    isDemoFixture: false,
  };
}

describe('engine/plan/evidence', () => {
  it('builds safe fallback supporting evidence when primary snapshot is null', () => {
    const ev = buildSupportingEvidence(null, null, false, 'unavailable', 'unavailable');
    expect(ev.providerLabel).toBe('No active provider');
    expect(ev.stationOrGridId).toBe('Unavailable');
    expect(ev.measuredAt).toBeNull();
    expect(ev.pm25).toBeNull();
    expect(ev.pm10).toBeNull();
    expect(ev.aqiValue).toBeNull();
    expect(ev.classification).toBe('unavailable');
  });

  it('deduplicates validation warnings and includes conflict and forecast limitations', () => {
    const withForecast = collectPlanLimitations(['Warn A', 'Warn A'], 'Station mismatch', true, [
      makeForecast('Pune', '12:00-16:00'),
    ]);
    expect(withForecast).toEqual([
      'Warn A',
      'Station mismatch',
      'Forecast guidance uses coarse grid estimates and cannot establish street-level air safety.',
    ]);

    const withoutForecast = collectPlanLimitations([], 'Ignored details', false, []);
    expect(withoutForecast).toEqual([
      'No verified forecast series is loaded for this city; alternative time windows cannot be projected.',
    ]);
  });

  it('filters forecasts case-insensitively by household city and collects fresh evidence', () => {
    const input: EngineInput = {
      household: baseHousehold,
      members: [],
      routines: [],
      primarySnapshot: makeSnapshot(),
      forecastSlots: [makeForecast('pune', '12:00-16:00'), makeForecast('Mumbai', '12:00-16:00')],
    };

    const bundle = collectPlanEvidence(input, NOW);
    expect(bundle.todayDate).toBe('2026-11-22');
    expect(bundle.forecasts).toHaveLength(1);
    expect(bundle.forecasts[0].city).toBe('pune');
    expect(bundle.isAvailable).toBe(true);
    expect(bundle.confidence).toBe('high_station_fresh');
    expect(bundle.classification).toBe('verified_live');
  });

  it('forces unavailable classification and hypothetical confidence in scenario mode', () => {
    const input: EngineInput = {
      household: baseHousehold,
      members: [],
      routines: [],
      primarySnapshot: makeSnapshot(),
      isScenario: true,
    };

    const bundle = collectPlanEvidence(input, NOW);
    expect(bundle.classification).toBe('unavailable');
    expect(bundle.confidence).toBe('hypothetical_simulation');
  });

  it('marks bundle unavailable when snapshot is null or lacks particulates and AQI', () => {
    const input: EngineInput = {
      household: baseHousehold,
      members: [],
      routines: [],
      primarySnapshot: null,
    };
    const bundle = collectPlanEvidence(input, NOW);
    expect(bundle.isAvailable).toBe(false);
    expect(bundle.aqiValue).toBeNull();
    expect(bundle.aqiBand).toBe('unavailable');
    expect(bundle.confidence).toBe('evidence_unavailable');
  });
});
