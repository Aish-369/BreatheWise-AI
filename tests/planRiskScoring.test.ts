import { describe, expect, it } from 'vitest';
import {
  bandToSeverity,
  determineConfidenceLevel,
  groupHouseholdMembers,
  isModerateOrWorseBand,
} from '../src/engine/plan/riskScoring';
import type { FamilyMember } from '../src/shared/types';

const NOW = '2026-11-22T09:00:00.000Z';

function makeMember(
  id: string,
  name: string,
  ageGroup: FamilyMember['ageGroup'],
  activityPreference: FamilyMember['activityPreference']
): FamilyMember {
  return {
    id,
    householdId: 'hh-1',
    name,
    ageGroup,
    activityPreference,
    routineFlexibility: 'flexible',
    createdAt: NOW,
  };
}

describe('engine/plan/riskScoring', () => {
  it('prioritizes confidence levels accurately across edge cases', () => {
    expect(
      determineConfidenceLevel({
        isScenario: true,
        isAvailable: true,
        hasConflict: true,
        freshness: 'stale',
        missingPrimaryParticulates: true,
        pm25: null,
      })
    ).toBe('hypothetical_simulation');

    expect(
      determineConfidenceLevel({
        isScenario: false,
        isAvailable: false,
        hasConflict: true,
        freshness: 'stale',
        missingPrimaryParticulates: false,
        pm25: 50,
      })
    ).toBe('evidence_unavailable');

    expect(
      determineConfidenceLevel({
        isScenario: false,
        isAvailable: true,
        hasConflict: true,
        freshness: 'fresh',
        missingPrimaryParticulates: false,
        pm25: 50,
      })
    ).toBe('provider_conflict');

    expect(
      determineConfidenceLevel({
        isScenario: false,
        isAvailable: true,
        hasConflict: false,
        freshness: 'stale',
        missingPrimaryParticulates: false,
        pm25: 50,
      })
    ).toBe('low_stale');

    expect(
      determineConfidenceLevel({
        isScenario: false,
        isAvailable: true,
        hasConflict: false,
        freshness: 'aging',
        missingPrimaryParticulates: false,
        pm25: 50,
      })
    ).toBe('moderate_aging');

    expect(
      determineConfidenceLevel({
        isScenario: false,
        isAvailable: true,
        hasConflict: false,
        freshness: 'fresh',
        missingPrimaryParticulates: false,
        pm25: null,
      })
    ).toBe('partial_pollutants');

    expect(
      determineConfidenceLevel({
        isScenario: false,
        isAvailable: true,
        hasConflict: false,
        freshness: 'fresh',
        missingPrimaryParticulates: false,
        pm25: 48,
      })
    ).toBe('high_station_fresh');
  });

  it('maps every NAQI band to recommendation severity and moderate+ predicate', () => {
    expect(bandToSeverity('good')).toBe('nominal');
    expect(bandToSeverity('satisfactory')).toBe('nominal');
    expect(bandToSeverity('moderate')).toBe('advisory');
    expect(bandToSeverity('poor')).toBe('caution');
    expect(bandToSeverity('very_poor')).toBe('elevated');
    expect(bandToSeverity('severe')).toBe('elevated');
    expect(bandToSeverity('unavailable')).toBe('unavailable');

    expect(isModerateOrWorseBand('good')).toBe(false);
    expect(isModerateOrWorseBand('satisfactory')).toBe(false);
    expect(isModerateOrWorseBand('unavailable')).toBe(false);
    expect(isModerateOrWorseBand('moderate')).toBe(true);
    expect(isModerateOrWorseBand('poor')).toBe(true);
    expect(isModerateOrWorseBand('very_poor')).toBe(true);
    expect(isModerateOrWorseBand('severe')).toBe(true);
  });

  it('groups empty and populated households including active outdoor adults only', () => {
    expect(groupHouseholdMembers([])).toEqual({
      infantToddler: [],
      schoolChild: [],
      adult: [],
      olderAdult: [],
      activeOutdoorAdults: [],
      allMemberNames: [],
    });

    const groups = groupHouseholdMembers([
      makeMember('m1', 'Dia', 'infant_toddler', 'mostly_indoors'),
      makeMember('m2', 'Aarav', 'school_child', 'outdoor_play'),
      makeMember('m3', 'Vikram', 'adult', 'outdoor_exercise'),
      makeMember('m4', 'Neha', 'adult', 'mostly_indoors'),
      makeMember('m5', 'Rohan', 'adult', 'commute'),
      makeMember('m6', 'Meera', 'older_adult', 'morning_walk'),
    ]);

    expect(groups.infantToddler).toEqual(['Dia']);
    expect(groups.schoolChild).toEqual(['Aarav']);
    expect(groups.adult).toEqual(['Vikram', 'Neha', 'Rohan']);
    expect(groups.olderAdult).toEqual(['Meera']);
    expect(groups.activeOutdoorAdults).toEqual(['Vikram', 'Rohan']);
    expect(groups.allMemberNames).toEqual(['Dia', 'Aarav', 'Vikram', 'Neha', 'Rohan', 'Meera']);
  });
});
