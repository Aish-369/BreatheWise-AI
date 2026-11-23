import { describe, expect, it } from 'vitest';
import { buildDailyPlanItems, buildUnavailableDailyPlan } from '../src/engine/plan/dailyPlan';
import { collectPlanEvidence } from '../src/engine/plan/evidence';
import type { EngineInput } from '../src/engine/plan/types';
import type {
  ActivityRoutine,
  EnvironmentalSnapshot,
  FamilyMember,
  ForecastSlot,
  HouseholdProfile,
} from '../src/shared/types';

const NOW = '2026-11-22T09:00:00.000Z';
const TODAY = '2026-11-22';

const household: HouseholdProfile = {
  id: 'hh-dp',
  name: 'Daily Plan Family',
  city: 'Pune',
  locality: 'Aundh',
  language: 'en',
  isDemoProfile: false,
  createdAt: NOW,
  updatedAt: NOW,
};

const adultOnlyMember: FamilyMember = {
  id: 'm-adult',
  householdId: 'hh-dp',
  name: 'Rohan',
  ageGroup: 'adult',
  activityPreference: 'outdoor_exercise',
  routineFlexibility: 'flexible',
  createdAt: NOW,
};

const childMember: FamilyMember = {
  id: 'm-child',
  householdId: 'hh-dp',
  name: 'Aarav',
  ageGroup: 'school_child',
  activityPreference: 'outdoor_play',
  routineFlexibility: 'flexible',
  createdAt: NOW,
};

const routines: ActivityRoutine[] = [
  {
    id: 'r-indoor',
    householdId: 'hh-dp',
    title: 'Indoor Yoga',
    environment: 'indoor',
    flexibility: 'flexible',
    preferredWindow: '06:00-09:00',
    memberIds: ['m-adult'],
    completedDate: TODAY,
    createdAt: NOW,
  },
  {
    id: 'r-out-flex',
    householdId: 'hh-dp',
    title: 'Evening Jog',
    environment: 'outdoor',
    flexibility: 'flexible',
    preferredWindow: '06:00-09:00',
    memberIds: ['m-adult'],
    createdAt: NOW,
  },
  {
    id: 'r-out-fixed',
    householdId: 'hh-dp',
    title: 'School Drop',
    environment: 'outdoor',
    flexibility: 'fixed',
    preferredWindow: '06:00-09:00',
    memberIds: ['m-child'],
    createdAt: NOW,
  },
];

function makeSnapshot(aqi: number, pm25: number, measuredAt = NOW): EnvironmentalSnapshot {
  return {
    id: 's-dp',
    provider: 'openaq',
    providerLabel: 'OpenAQ',
    dataType: 'physical_station',
    city: 'Pune',
    locationLabel: 'Aundh',
    stationOrGridId: 'AQ-1',
    spatialResolutionNote: 'Station',
    pollutants: { pm25, pm10: pm25 * 1.6 },
    reportedAqiIndia: aqi,
    measuredAt,
    retrievedAt: NOW,
    freshness: 'fresh',
    licenseAttribution: 'CC-BY',
    warnings: [],
    isDemoFixture: false,
    isAvailable: true,
  };
}

describe('engine/plan/dailyPlan', () => {
  it('returns empty list when household has zero routines', () => {
    const input: EngineInput = {
      household,
      members: [adultOnlyMember],
      routines: [],
      primarySnapshot: makeSnapshot(40, 20),
    };
    expect(buildUnavailableDailyPlan(input, TODAY)).toEqual([]);
    expect(buildDailyPlanItems(input, collectPlanEvidence(input, NOW))).toEqual([]);
  });

  it('keeps completedToday status and holds outdoor routines when unavailable', () => {
    const items = buildUnavailableDailyPlan(
      {
        household,
        members: [adultOnlyMember, childMember],
        routines,
        primarySnapshot: null,
      },
      TODAY
    );
    expect(items.find((i) => i.routineId === 'r-indoor')?.completedToday).toBe(true);
    expect(items.find((i) => i.routineId === 'r-indoor')?.status).toBe('proceed_as_planned');
    expect(items.find((i) => i.routineId === 'r-out-flex')?.status).toBe('hold_pending_data');
    expect(items.find((i) => i.routineId === 'r-out-fixed')?.status).toBe('hold_pending_data');
  });

  it('proceeds as planned at Satisfactory AQI for adult-only routines but adds precautions when sensitivity tags exist', () => {
    const adultInput: EngineInput = {
      household,
      members: [adultOnlyMember, childMember],
      routines: [routines[1]],
      primarySnapshot: makeSnapshot(85, 48),
    };
    const adultItems = buildDailyPlanItems(adultInput, collectPlanEvidence(adultInput, NOW));
    expect(adultItems[0].status).toBe('proceed_as_planned');

    const sensitiveInput: EngineInput = {
      ...adultInput,
      household: { ...household, sensitivityTags: ['respiratory_comfort'] },
    };
    const sensitiveItems = buildDailyPlanItems(
      sensitiveInput,
      collectPlanEvidence(sensitiveInput, NOW)
    );
    expect(sensitiveItems[0].status).toBe('proceed_with_precautions');
  });

  it('keeps indoor spaces closed at Poor AQI and uses high precautions for fixed severe outdoor routines', () => {
    const forecast: ForecastSlot = {
      id: 'f-clean',
      city: 'Pune',
      timeWindow: '12:00-16:00',
      forecastDate: TODAY,
      expectedPm25: 40,
      expectedPm10: 75,
      expectedAqiIndia: 68,
      trend: 'improving',
      dataType: 'forecast',
      providerLabel: 'CAMS',
      gridResolutionNote: 'Coarse',
      issuedAt: NOW,
      licenseAttribution: 'CAMS',
      isDemoFixture: false,
    };

    const poorInput: EngineInput = {
      household,
      members: [adultOnlyMember, childMember],
      routines,
      primarySnapshot: makeSnapshot(240, 102),
      forecastSlots: [forecast],
    };
    const poorItems = buildDailyPlanItems(poorInput, collectPlanEvidence(poorInput, NOW));
    expect(poorItems.find((i) => i.routineId === 'r-indoor')?.rationaleKey).toBe(
      'plan_indoor_keep_closed'
    );

    const severeInput: EngineInput = {
      ...poorInput,
      primarySnapshot: makeSnapshot(430, 270),
      forecastSlots: [],
    };
    const severeItems = buildDailyPlanItems(severeInput, collectPlanEvidence(severeInput, NOW));
    expect(severeItems.find((i) => i.routineId === 'r-out-fixed')?.rationaleKey).toBe(
      'plan_fixed_high_precaution'
    );
    expect(severeItems.find((i) => i.routineId === 'r-out-flex')?.status).toBe('move_indoors');
    expect(severeItems.find((i) => i.routineId === 'r-out-flex')?.limitationKey).toBe(
      'no_verified_forecast'
    );
  });
});
