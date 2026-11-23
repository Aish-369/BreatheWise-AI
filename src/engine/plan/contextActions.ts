import type { Recommendation } from '../../shared/types';
import {
  buildPollutantRecommendations,
  buildSensitivityRecommendations,
} from './pollutantAndSensitivityActions';
import { isModerateOrWorseBand } from './riskScoring';
import type { EngineInput, EvidenceBundle, MemberGroups } from './types';

export { buildPollutantRecommendations, buildSensitivityRecommendations };

export function buildInfantAndChildRecommendations(
  input: EngineInput,
  bundle: EvidenceBundle,
  groups: MemberGroups
): Recommendation[] {
  const recs: Recommendation[] = [];
  const measuredAt = input.primarySnapshot?.measuredAt ?? null;
  const { aqiBand, aqiValue } = bundle;

  if (groups.infantToddler.length > 0 && aqiBand !== 'good') {
    recs.push({
      id: 'rec-infant-toddler',
      titleKey: 'rec_infant_title',
      explanationKey: aqiBand === 'satisfactory' ? 'rec_infant_low_expl' : 'rec_infant_high_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: groups.infantToddler,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey:
        aqiBand === 'satisfactory' ? 'rec_infant_low_action' : 'rec_infant_high_action',
      reasonGeneratedKey: 'rec_reason_age_sensitivity',
      reasonGeneratedParams: { group: 'infant_toddler', aqi: aqiValue ?? 0 },
      reconsiderWhenKey: 'reconsider_when_aqi_drops',
      evidenceTrail: {
        evidenceMetric: `NAQI ${aqiValue ?? 'N/A'} (> 50 threshold for infants/toddlers)`,
        ruleTriggered: 'AGE_GROUP_INFANT_TODDLER',
        householdContext: groups.infantToddler.join(', '),
        reconsiderWhenKey: 'reconsider_when_aqi_drops',
      },
      severity: aqiBand === 'satisfactory' ? 'advisory' : 'elevated',
    });
  }

  if (groups.schoolChild.length > 0 && isModerateOrWorseBand(aqiBand)) {
    recs.push({
      id: 'rec-school-child',
      titleKey: 'rec_child_title',
      explanationKey: aqiBand === 'moderate' ? 'rec_child_mod_expl' : 'rec_child_high_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: groups.schoolChild,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: aqiBand === 'moderate' ? 'rec_child_mod_action' : 'rec_child_high_action',
      reasonGeneratedKey: 'rec_reason_age_sensitivity',
      reasonGeneratedParams: { group: 'school_child', aqi: aqiValue ?? 0 },
      reconsiderWhenKey: 'reconsider_when_aqi_drops',
      evidenceTrail: {
        evidenceMetric: `NAQI ${aqiValue ?? 'N/A'} (>= 101 school outdoor exertion threshold)`,
        ruleTriggered: 'AGE_GROUP_SCHOOL_CHILD',
        householdContext: groups.schoolChild.join(', '),
        reconsiderWhenKey: 'reconsider_when_aqi_drops',
      },
      severity: aqiBand === 'moderate' ? 'advisory' : 'caution',
    });
  }

  return recs;
}

export function buildElderAndAdultRecommendations(
  input: EngineInput,
  bundle: EvidenceBundle,
  groups: MemberGroups
): Recommendation[] {
  const recs: Recommendation[] = [];
  const measuredAt = input.primarySnapshot?.measuredAt ?? null;
  const { aqiBand, aqiValue } = bundle;
  if (!isModerateOrWorseBand(aqiBand)) return recs;

  if (groups.olderAdult.length > 0) {
    recs.push({
      id: 'rec-older-adult',
      titleKey: 'rec_elder_title',
      explanationKey: aqiBand === 'moderate' ? 'rec_elder_mod_expl' : 'rec_elder_high_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: groups.olderAdult,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: aqiBand === 'moderate' ? 'rec_elder_mod_action' : 'rec_elder_high_action',
      reasonGeneratedKey: 'rec_reason_age_sensitivity',
      reasonGeneratedParams: { group: 'older_adult', aqi: aqiValue ?? 0 },
      reconsiderWhenKey: 'reconsider_when_aqi_drops',
      evidenceTrail: {
        evidenceMetric: `NAQI ${aqiValue ?? 'N/A'} (>= 101 older adult outdoor precaution threshold)`,
        ruleTriggered: 'AGE_GROUP_OLDER_ADULT',
        householdContext: groups.olderAdult.join(', '),
        reconsiderWhenKey: 'reconsider_when_aqi_drops',
      },
      severity: aqiBand === 'moderate' ? 'caution' : 'elevated',
    });
  }

  if (groups.activeOutdoorAdults.length > 0) {
    recs.push({
      id: 'rec-active-adults',
      titleKey: 'rec_adult_active_title',
      explanationKey: 'rec_adult_active_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: groups.activeOutdoorAdults,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: aqiBand === 'moderate' ? 'rec_adult_mod_action' : 'rec_adult_high_action',
      reasonGeneratedKey: 'rec_reason_activity_intensity',
      reasonGeneratedParams: { aqi: aqiValue ?? 0 },
      reconsiderWhenKey: 'reconsider_when_aqi_drops',
      evidenceTrail: {
        evidenceMetric: `NAQI ${aqiValue ?? 'N/A'} with outdoor workout/commute activity`,
        ruleTriggered: 'ACTIVITY_INTENSITY_ADULT',
        householdContext: groups.activeOutdoorAdults.join(', '),
        reconsiderWhenKey: 'reconsider_when_aqi_drops',
      },
      severity: aqiBand === 'moderate' ? 'advisory' : 'caution',
    });
  }

  return recs;
}
