import { describe, expect, it } from 'vitest';
import {
  buildElderAndAdultRecommendations,
  buildInfantAndChildRecommendations,
  buildPollutantRecommendations,
  buildSensitivityRecommendations,
} from '../src/engine/plan/contextActions';
import { collectPlanEvidence } from '../src/engine/plan/evidence';
import { groupHouseholdMembers } from '../src/engine/plan/riskScoring';
import type { EngineInput } from '../src/engine/plan/types';
import type {
  ActivityRoutine,
  EnvironmentalSnapshot,
  FamilyMember,
  HouseholdProfile,
} from '../src/shared/types';

const NOW = '2026-11-22T10:00:00.000Z';

const members: FamilyMember[] = [
  {
    id: 'm1',
    householdId: 'hh-ctx',
    name: 'Baby Dia',
    ageGroup: 'infant_toddler',
    activityPreference: 'mostly_indoors',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
  {
    id: 'm2',
    householdId: 'hh-ctx',
    name: 'Aarav',
    ageGroup: 'school_child',
    activityPreference: 'outdoor_play',
    routineFlexibility: 'fixed',
    createdAt: NOW,
  },
  {
    id: 'm3',
    householdId: 'hh-ctx',
    name: 'Meera',
    ageGroup: 'older_adult',
    activityPreference: 'morning_walk',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
  {
    id: 'm4',
    householdId: 'hh-ctx',
    name: 'Vikram',
    ageGroup: 'adult',
    activityPreference: 'commute',
    routineFlexibility: 'fixed',
    createdAt: NOW,
  },
];

const earlyCommuteRoutine: ActivityRoutine = {
  id: 'r-commute',
  householdId: 'hh-ctx',
  title: 'Early Bus Stop',
  environment: 'outdoor',
  flexibility: 'fixed',
  preferredWindow: '06:00-09:00',
  memberIds: ['m4'],
  createdAt: NOW,
};

function makeInput(
  pollutants: EnvironmentalSnapshot['pollutants'],
  aqi: number,
  sensitivityTags: HouseholdProfile['sensitivityTags'] = []
): EngineInput {
  return {
    household: {
      id: 'hh-ctx',
      name: 'Context Family',
      city: 'Delhi',
      locality: 'RK Puram',
      language: 'en',
      sensitivityTags,
      isDemoProfile: false,
      createdAt: NOW,
      updatedAt: NOW,
    },
    members,
    routines: [earlyCommuteRoutine],
    primarySnapshot: {
      id: 'snap-ctx',
      provider: 'cpcb',
      providerLabel: 'CPCB RK Puram',
      dataType: 'physical_station',
      city: 'Delhi',
      locationLabel: 'RK Puram',
      stationOrGridId: 'DL-01',
      spatialResolutionNote: 'Station',
      pollutants,
      reportedAqiIndia: aqi,
      measuredAt: '2026-11-22T09:30:00.000Z',
      retrievedAt: NOW,
      freshness: 'fresh',
      licenseAttribution: 'GODL',
      warnings: [],
      isDemoFixture: false,
      isAvailable: true,
    },
  };
}

describe('engine/plan/contextActions', () => {
  it('suppresses age, sensitivity (except none), and pollutant guidance when AQI is Good and gas levels are safe', () => {
    const input = makeInput({ pm25: 15, pm10: 30, no2: 20, o3: 25 }, 30, [
      'respiratory_comfort',
      'early_commute_exposure',
    ]);
    const bundle = collectPlanEvidence(input, NOW);
    const groups = groupHouseholdMembers(members);

    expect(buildInfantAndChildRecommendations(input, bundle, groups)).toEqual([]);
    expect(buildElderAndAdultRecommendations(input, bundle, groups)).toEqual([]);
    expect(buildPollutantRecommendations(input, bundle, groups.allMemberNames)).toEqual([]);
    expect(buildSensitivityRecommendations(input, bundle, groups.allMemberNames)).toEqual([]);
  });

  it('triggers infant low caution at Satisfactory without triggering moderate+ groups', () => {
    const input = makeInput({ pm25: 42, pm10: 82 }, 78, ['respiratory_comfort']);
    const bundle = collectPlanEvidence(input, NOW);
    const groups = groupHouseholdMembers(members);

    const infantRecs = buildInfantAndChildRecommendations(input, bundle, groups);
    expect(infantRecs.map((r) => r.id)).toEqual(['rec-infant-toddler']);
    expect(infantRecs[0].severity).toBe('advisory');
    expect(buildElderAndAdultRecommendations(input, bundle, groups)).toEqual([]);

    const sensRecs = buildSensitivityRecommendations(input, bundle, groups.allMemberNames);
    expect(sensRecs.find((r) => r.id === 'rec-sens-respiratory')?.severity).toBe('advisory');
  });

  it('triggers pollutant-specific NO2 (> 180 elevated), O3 (> 100), and coarse dust (PM10 > 100 with low PM2.5)', () => {
    const input = makeInput({ pm25: 48, pm10: 145, no2: 195, o3: 112 }, 150, [
      'dust_sensitive',
      'respiratory_comfort',
      'early_commute_exposure',
    ]);
    const bundle = collectPlanEvidence(input, NOW);
    const groups = groupHouseholdMembers(members);

    const pollRecs = buildPollutantRecommendations(input, bundle, groups.allMemberNames);
    expect(pollRecs.find((r) => r.id === 'rec-pollutant-no2')?.severity).toBe('elevated');
    expect(pollRecs.find((r) => r.id === 'rec-pollutant-o3')?.severity).toBe('caution');
    expect(pollRecs.find((r) => r.id === 'rec-pollutant-dust')?.severity).toBe('advisory');

    const sensRecs = buildSensitivityRecommendations(input, bundle, groups.allMemberNames);
    expect(sensRecs.map((r) => r.id)).toEqual([
      'rec-sens-dust',
      'rec-sens-respiratory',
      'rec-sens-commute',
    ]);

    const elderAndAdult = buildElderAndAdultRecommendations(input, bundle, groups);
    expect(elderAndAdult.find((r) => r.id === 'rec-older-adult')?.severity).toBe('caution');
    expect(elderAndAdult.find((r) => r.id === 'rec-active-adults')?.severity).toBe('advisory');
  });

  it('skips coarse-dust notice when fine PM2.5 dominates (> 60) and escalates severe age severities', () => {
    const input = makeInput({ pm25: 260, pm10: 380, no2: 95 }, 420);
    const bundle = collectPlanEvidence(input, NOW);
    const groups = groupHouseholdMembers(members);

    const pollRecs = buildPollutantRecommendations(input, bundle, groups.allMemberNames);
    expect(pollRecs.find((r) => r.id === 'rec-pollutant-no2')?.severity).toBe('caution');
    expect(pollRecs.some((r) => r.id === 'rec-pollutant-dust')).toBe(false);

    const infantAndChild = buildInfantAndChildRecommendations(input, bundle, groups);
    expect(infantAndChild.find((r) => r.id === 'rec-infant-toddler')?.severity).toBe('elevated');
    expect(infantAndChild.find((r) => r.id === 'rec-school-child')?.severity).toBe('caution');

    const elderAndAdult = buildElderAndAdultRecommendations(input, bundle, groups);
    expect(elderAndAdult.find((r) => r.id === 'rec-older-adult')?.severity).toBe('elevated');
    expect(elderAndAdult.find((r) => r.id === 'rec-active-adults')?.severity).toBe('caution');
  });
});
