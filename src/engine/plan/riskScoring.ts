import type {
  AqiBand,
  ConfidenceOrLimitationKey,
  FamilyMember,
  FreshnessStatus,
  RecommendationSeverity,
} from '../../shared/types';
import type { MemberGroups } from './types';

export interface ConfidenceInput {
  isScenario: boolean;
  isAvailable: boolean;
  hasConflict: boolean;
  freshness: FreshnessStatus;
  missingPrimaryParticulates: boolean;
  pm25: number | null | undefined;
}

export function determineConfidenceLevel(input: ConfidenceInput): ConfidenceOrLimitationKey {
  if (input.isScenario) return 'hypothetical_simulation';
  if (!input.isAvailable) return 'evidence_unavailable';
  if (input.hasConflict) return 'provider_conflict';
  if (input.freshness === 'stale') return 'low_stale';
  if (input.freshness === 'aging') return 'moderate_aging';
  if (input.missingPrimaryParticulates || input.pm25 == null) {
    return 'partial_pollutants';
  }
  return 'high_station_fresh';
}

export function bandToSeverity(aqiBand: AqiBand): RecommendationSeverity {
  if (aqiBand === 'good' || aqiBand === 'satisfactory') return 'nominal';
  if (aqiBand === 'moderate') return 'advisory';
  if (aqiBand === 'poor') return 'caution';
  if (aqiBand === 'unavailable') return 'unavailable';
  return 'elevated';
}

export function isModerateOrWorseBand(aqiBand: AqiBand): boolean {
  return (
    aqiBand === 'moderate' || aqiBand === 'poor' || aqiBand === 'very_poor' || aqiBand === 'severe'
  );
}

export function groupHouseholdMembers(members: FamilyMember[]): MemberGroups {
  const infantToddler = members.filter((m) => m.ageGroup === 'infant_toddler').map((m) => m.name);
  const schoolChild = members.filter((m) => m.ageGroup === 'school_child').map((m) => m.name);
  const adult = members.filter((m) => m.ageGroup === 'adult').map((m) => m.name);
  const olderAdult = members.filter((m) => m.ageGroup === 'older_adult').map((m) => m.name);
  const activeOutdoorAdults = members
    .filter(
      (m) =>
        m.ageGroup === 'adult' &&
        (m.activityPreference === 'outdoor_exercise' ||
          m.activityPreference === 'morning_walk' ||
          m.activityPreference === 'commute')
    )
    .map((m) => m.name);

  return {
    infantToddler,
    schoolChild,
    adult,
    olderAdult,
    activeOutdoorAdults,
    allMemberNames: members.map((m) => m.name),
  };
}
