import { describe, expect, it } from 'vitest';
import { generateProtectionPlan, runWhatIfScenario } from '../src/engine/intelligence';
import {
  classifyFreshness,
  deriveAqiFromPollutants,
  detectProviderConflict,
  validateEnvironmentalSnapshot,
} from '../src/engine/quality';
import type {
  ActivityRoutine,
  EnvironmentalSnapshot,
  FamilyMember,
  ForecastSlot,
  HouseholdProfile,
} from '../src/shared/types';

const NOW = '2026-11-21T08:00:00.000Z';
const THIRTY_MINS_AGO = '2026-11-21T07:30:00.000Z';
const FOUR_HOURS_AGO = '2026-11-21T04:00:00.000Z';
const NINE_HOURS_AGO = '2026-11-20T23:00:00.000Z';
const FUTURE_TS = '2026-11-21T10:00:00.000Z';

const baseHousehold: HouseholdProfile = {
  id: 'hh-1',
  name: 'Test Household',
  city: 'Pune',
  locality: 'Shivajinagar',
  language: 'en',
  isDemoProfile: true,
  createdAt: NOW,
  updatedAt: NOW,
};

const fullMembers: FamilyMember[] = [
  {
    id: 'm1',
    householdId: 'hh-1',
    name: 'Baby Dia',
    ageGroup: 'infant_toddler',
    activityPreference: 'mostly_indoors',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
  {
    id: 'm2',
    householdId: 'hh-1',
    name: 'Aarav',
    ageGroup: 'school_child',
    activityPreference: 'outdoor_play',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
  {
    id: 'm3',
    householdId: 'hh-1',
    name: 'Sunanda',
    ageGroup: 'older_adult',
    activityPreference: 'morning_walk',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
  {
    id: 'm4',
    householdId: 'hh-1',
    name: 'Vikram',
    ageGroup: 'adult',
    activityPreference: 'outdoor_exercise',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
];

const sampleRoutines: ActivityRoutine[] = [
  {
    id: 'r-fixed',
    householdId: 'hh-1',
    title: 'School Commute',
    environment: 'outdoor',
    flexibility: 'fixed',
    preferredWindow: '06:00-09:00',
    memberIds: ['m2'],
    createdAt: NOW,
  },
  {
    id: 'r-flex-walk',
    householdId: 'hh-1',
    title: 'Morning Walk',
    environment: 'outdoor',
    flexibility: 'flexible',
    preferredWindow: '06:00-09:00',
    memberIds: ['m3', 'm4'],
    createdAt: NOW,
  },
  {
    id: 'r-indoor',
    householdId: 'hh-1',
    title: 'Indoor Reading',
    environment: 'indoor',
    flexibility: 'fixed',
    preferredWindow: '19:00-22:00',
    memberIds: ['m1', 'm2'],
    createdAt: NOW,
  },
];

function makeSnapshot(overrides: Partial<EnvironmentalSnapshot> = {}): EnvironmentalSnapshot {
  return {
    id: 'snap-1',
    provider: 'openaq',
    providerLabel: 'OpenAQ Station',
    dataType: 'physical_station',
    city: 'Pune',
    locationLabel: 'Shivajinagar',
    stationOrGridId: 'STN-01',
    spatialResolutionNote: 'Station point',
    pollutants: { pm25: 68, pm10: 120, no2: 40, o3: 35 },
    reportedAqiIndia: 127,
    measuredAt: THIRTY_MINS_AGO,
    retrievedAt: NOW,
    freshness: 'fresh',
    licenseAttribution: 'Open license',
    warnings: [],
    isDemoFixture: false,
    isAvailable: true,
    ...overrides,
  };
}

const puneForecasts: ForecastSlot[] = [
  {
    id: 'f1',
    city: 'Pune',
    timeWindow: '06:00-09:00',
    forecastDate: '2026-11-21',
    expectedPm25: 76,
    expectedPm10: 135,
    expectedAqiIndia: 153,
    trend: 'worsening',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: 'Coarse 40km grid',
    issuedAt: THIRTY_MINS_AGO,
    licenseAttribution: 'CAMS',
    isDemoFixture: false,
  },
  {
    id: 'f2',
    city: 'Pune',
    timeWindow: '12:00-16:00',
    forecastDate: '2026-11-21',
    expectedPm25: 42,
    expectedPm10: 84,
    expectedAqiIndia: 70,
    trend: 'improving',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: 'Coarse 40km grid',
    issuedAt: THIRTY_MINS_AGO,
    licenseAttribution: 'CAMS',
    isDemoFixture: false,
  },
];

describe('Quality & Provenance Engine', () => {
  it('1. classifies fresh measurements <= 2 hours', () => {
    expect(classifyFreshness(THIRTY_MINS_AGO, NOW)).toBe('fresh');
  });

  it('2. classifies aging measurements between 2 and 6 hours', () => {
    expect(classifyFreshness(FOUR_HOURS_AGO, NOW)).toBe('aging');
  });

  it('3. classifies stale measurements > 6 hours', () => {
    expect(classifyFreshness(NINE_HOURS_AGO, NOW)).toBe('stale');
  });

  it('4. rejects missing or far-future timestamps as unavailable', () => {
    expect(classifyFreshness(null, NOW)).toBe('unavailable');
    expect(classifyFreshness(FUTURE_TS, NOW)).toBe('unavailable');
  });

  it('5. derives India NAQI sub-index transparently when official AQI is omitted', () => {
    const res = deriveAqiFromPollutants({ pm25: 68, pm10: 120 }, null);
    expect(res.isDerived).toBe(true);
    expect(res.dominantPollutant).toBe('PM2.5');
    expect(res.aqi).toBeGreaterThan(100);
    expect(res.band).toBe('moderate');
  });

  it('6. handles incomplete pollutant data where PM2.5 is missing but PM10 exists', () => {
    const snap = makeSnapshot({ pollutants: { pm10: 140 }, reportedAqiIndia: null });
    const val = validateEnvironmentalSnapshot(snap, NOW);
    expect(val.valid).toBe(true);
    expect(val.derivedAqi.dominantPollutant).toBe('PM10');
    expect(val.warnings.some((w) => w.includes('PM2.5 reading is unavailable'))).toBe(true);
  });

  it('7. flags missing primary particulates when both PM2.5 and PM10 are absent', () => {
    const snap = makeSnapshot({ pollutants: {}, reportedAqiIndia: null });
    const val = validateEnvironmentalSnapshot(snap, NOW);
    expect(val.valid).toBe(false);
    expect(val.missingPrimaryParticulates).toBe(true);
  });

  it('8. detects conflicting providers in the same city', () => {
    const primary = makeSnapshot({ id: 'p1', reportedAqiIndia: 145, pollutants: { pm25: 75 } });
    const secondary = makeSnapshot({
      id: 'p2',
      providerLabel: 'Second Station',
      reportedAqiIndia: 85,
      pollutants: { pm25: 42 },
    });
    const conflict = detectProviderConflict(primary, [secondary], NOW);
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.conflictWarningKey).toBe('conflict_provider_divergence');
  });
});

describe('Deterministic Family Protection Intelligence Engine (20+ Scenarios)', () => {
  it('9. generates favorable guidance and open cross-ventilation under Good AQI', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({
        reportedAqiIndia: 38,
        pollutants: { pm25: 18, pm10: 36 },
      }),
      nowIso: NOW,
    });
    expect(plan.aqiBand).toBe('good');
    expect(plan.recommendations.some((r) => r.id === 'rec-ventilation-open')).toBe(true);
    expect(plan.dailyPlan.find((d) => d.routineId === 'r-flex-walk')?.status).toBe(
      'proceed_as_planned'
    );
  });

  it('10. triggers infant/toddler mild caution even at Satisfactory AQI', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: [fullMembers[0]],
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({
        reportedAqiIndia: 80,
        pollutants: { pm25: 46, pm10: 80 },
      }),
      nowIso: NOW,
    });
    expect(plan.aqiBand).toBe('satisfactory');
    expect(plan.recommendations.some((r) => r.id === 'rec-infant-toddler')).toBe(true);
  });

  it('11. generates age-specific guidance for school children, older adults, and active adults at Moderate AQI', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot(),
      forecastSlots: puneForecasts,
      nowIso: NOW,
    });
    const ids = plan.recommendations.map((r) => r.id);
    expect(ids).toContain('rec-school-child');
    expect(ids).toContain('rec-older-adult');
    expect(ids).toContain('rec-active-adults');
    expect(ids).toContain('rec-ventilation-limit');
  });

  it('12. respects fixed commitments instead of advising cancellation', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({ reportedAqiIndia: 230, pollutants: { pm25: 98 } }),
      nowIso: NOW,
    });
    const fixedItem = plan.dailyPlan.find((d) => d.routineId === 'r-fixed');
    expect(fixedItem?.status).toBe('proceed_with_precautions');
    expect(fixedItem?.suggestedWindow).toBeNull();
  });

  it('13. shifts flexible outdoor activity ONLY when valid forecast shows material improvement', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({ reportedAqiIndia: 145, pollutants: { pm25: 74 } }),
      forecastSlots: puneForecasts,
      nowIso: NOW,
    });
    const flexItem = plan.dailyPlan.find((d) => d.routineId === 'r-flex-walk');
    expect(flexItem?.status).toBe('adjust_window');
    expect(flexItem?.suggestedWindow).toBe('12:00-16:00');
    expect(flexItem?.limitationKey).toBe('coarse_grid_forecast');
  });

  it('14. never invents an alternative time window when forecast is unavailable', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({ reportedAqiIndia: 145, pollutants: { pm25: 74 } }),
      forecastSlots: [],
      nowIso: NOW,
    });
    const flexItem = plan.dailyPlan.find((d) => d.routineId === 'r-flex-walk');
    expect(flexItem?.suggestedWindow).toBeNull();
    expect(flexItem?.limitationKey).toBe('no_verified_forecast');
  });

  it('15. moves flexible outdoor routine indoors when Poor AQI has no clean forecast window', () => {
    const poorForecast: ForecastSlot[] = puneForecasts.map((f) => ({
      ...f,
      expectedPm25: 110,
      expectedAqiIndia: 250,
    }));
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({ reportedAqiIndia: 250, pollutants: { pm25: 110 } }),
      forecastSlots: poorForecast,
      nowIso: NOW,
    });
    const flexItem = plan.dailyPlan.find((d) => d.routineId === 'r-flex-walk');
    expect(flexItem?.status).toBe('move_indoors');
  });

  it('16. handles unavailable environmental data safely without fake safety promises', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({ isAvailable: false, measuredAt: null, pollutants: {} }),
      nowIso: NOW,
    });
    expect(plan.isAvailable).toBe(false);
    expect(plan.aqiBand).toBe('unavailable');
    expect(plan.recommendations[0].id).toBe('rec-unavailable');
    expect(plan.dailyPlan.find((d) => d.routineId === 'r-flex-walk')?.status).toBe(
      'hold_pending_data'
    );
    expect(plan.dailyPlan.find((d) => d.routineId === 'r-indoor')?.status).toBe(
      'proceed_as_planned'
    );
  });

  it('17. flags stale data (> 6 hours) and holds flexible outdoor scheduling', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({ measuredAt: NINE_HOURS_AGO }),
      nowIso: NOW,
    });
    expect(plan.freshness).toBe('stale');
    expect(plan.recommendations.some((r) => r.id === 'rec-stale-warning')).toBe(true);
    expect(plan.dailyPlan.find((d) => d.routineId === 'r-flex-walk')?.status).toBe(
      'hold_pending_data'
    );
  });

  it('18. surfaces conflicting provider warning inside recommendations', () => {
    const primary = makeSnapshot({ reportedAqiIndia: 160, pollutants: { pm25: 80 } });
    const secondary = makeSnapshot({
      id: 'snap-2',
      providerLabel: 'Station B',
      reportedAqiIndia: 85,
      pollutants: { pm25: 40 },
    });
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: primary,
      secondarySnapshots: [secondary],
      nowIso: NOW,
    });
    expect(plan.conflictWarningKey).toBe('conflict_provider_divergence');
    expect(plan.recommendations.some((r) => r.id === 'rec-conflict')).toBe(true);
  });

  it('19. handles Severe AQI (> 400) with elevated severity recommendations', () => {
    const plan = generateProtectionPlan({
      household: baseHousehold,
      members: fullMembers,
      routines: sampleRoutines,
      primarySnapshot: makeSnapshot({ reportedAqiIndia: 430, pollutants: { pm25: 270 } }),
      nowIso: NOW,
    });
    expect(plan.aqiBand).toBe('severe');
    expect(plan.recommendations.find((r) => r.id === 'rec-household-general')?.severity).toBe(
      'elevated'
    );
  });

  it('20. What-If Scenario Simulator marks output unmistakably as hypothetical and computes diff', () => {
    const scenario = runWhatIfScenario(
      {
        household: baseHousehold,
        members: fullMembers,
        routines: sampleRoutines,
        primarySnapshot: makeSnapshot({ reportedAqiIndia: 75, pollutants: { pm25: 42 } }),
        forecastSlots: [],
        nowIso: NOW,
      },
      {
        label: 'Severe spike simulation',
        pm25Override: 180,
      }
    );
    expect(scenario.isScenario).toBe(true);
    expect(scenario.disclaimerBanner).toBe(
      'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT'
    );
    expect(scenario.baselinePlan.aqiBand).toBe('satisfactory');
    expect(scenario.scenarioPlan.aqiBand).toBe('very_poor');
    expect(scenario.changedScheduleCount).toBeGreaterThan(0);
  });

  it('21. What-If Scenario moving an outdoor activity indoors eliminates outdoor exposure shift', () => {
    const scenario = runWhatIfScenario(
      {
        household: baseHousehold,
        members: fullMembers,
        routines: sampleRoutines,
        primarySnapshot: makeSnapshot({ reportedAqiIndia: 240, pollutants: { pm25: 105 } }),
        nowIso: NOW,
      },
      {
        label: 'Move walk indoors',
        overrideRoutineId: 'r-flex-walk',
        overrideEnvironment: 'indoor',
      }
    );
    const updatedItem = scenario.scenarioPlan.dailyPlan.find(
      (d) => d.routineId === 'r-flex-walk'
    );
    expect(updatedItem?.environment).toBe('indoor');
    expect(updatedItem?.status).toBe('proceed_as_planned');
  });

  it('22. What-If Scenario simulating stale/unavailable evidence drops confidence honestly', () => {
    const scenario = runWhatIfScenario(
      {
        household: baseHousehold,
        members: fullMembers,
        routines: sampleRoutines,
        primarySnapshot: makeSnapshot(),
        nowIso: NOW,
      },
      {
        label: 'Simulate outage',
        simulateUnavailable: true,
      }
    );
    expect(scenario.scenarioPlan.isAvailable).toBe(false);
    expect(scenario.changeSummaryKeys).toContain('scenario_diff_confidence_dropped');
  });
});
