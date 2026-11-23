import type { Recommendation, SensitivityTag } from '../../shared/types';
import { isModerateOrWorseBand } from './riskScoring';
import type { EngineInput, EvidenceBundle, MemberGroups } from './types';

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

export function buildPollutantRecommendations(
  input: EngineInput,
  bundle: EvidenceBundle,
  allMemberNames: string[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const measuredAt = input.primarySnapshot?.measuredAt ?? null;
  const pollutants = input.primarySnapshot?.pollutants ?? {};

  if (typeof pollutants.no2 === 'number' && pollutants.no2 > 80) {
    recs.push({
      id: 'rec-pollutant-no2',
      titleKey: 'rec_no2_title',
      titleParams: { no2: pollutants.no2 },
      explanationKey: 'rec_no2_expl',
      explanationParams: { no2: pollutants.no2 },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: 'rec_no2_action',
      reasonGeneratedKey: 'rec_reason_pollutant_no2',
      reasonGeneratedParams: { no2: pollutants.no2 },
      reconsiderWhenKey: 'reconsider_when_traffic_eases',
      evidenceTrail: {
        evidenceMetric: `NO2 = ${pollutants.no2} µg/m³ (> 80 CPCB benchmark)`,
        ruleTriggered: 'POLLUTANT_NO2_ELEVATED',
        householdContext: `Traffic-corridor exposure in ${input.household.city}`,
        reconsiderWhenKey: 'reconsider_when_traffic_eases',
      },
      severity: pollutants.no2 > 180 ? 'elevated' : 'caution',
    });
  }

  if (typeof pollutants.o3 === 'number' && pollutants.o3 > 100) {
    recs.push({
      id: 'rec-pollutant-o3',
      titleKey: 'rec_o3_title',
      titleParams: { o3: pollutants.o3 },
      explanationKey: 'rec_o3_expl',
      explanationParams: { o3: pollutants.o3 },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: 'rec_o3_action',
      reasonGeneratedKey: 'rec_reason_pollutant_o3',
      reasonGeneratedParams: { o3: pollutants.o3 },
      reconsiderWhenKey: 'reconsider_when_evening_cools',
      evidenceTrail: {
        evidenceMetric: `O3 = ${pollutants.o3} µg/m³ (> 100 CPCB 8h benchmark)`,
        ruleTriggered: 'POLLUTANT_O3_ELEVATED',
        householdContext: `Sunlight-driven outdoor ozone in ${input.household.city}`,
        reconsiderWhenKey: 'reconsider_when_evening_cools',
      },
      severity: 'caution',
    });
  }

  if (
    typeof pollutants.pm10 === 'number' &&
    pollutants.pm10 > 100 &&
    (pollutants.pm25 == null || pollutants.pm25 <= 60)
  ) {
    recs.push({
      id: 'rec-pollutant-dust',
      titleKey: 'rec_dust_title',
      titleParams: { pm10: pollutants.pm10 },
      explanationKey: 'rec_dust_expl',
      explanationParams: { pm10: pollutants.pm10 },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: 'rec_dust_action',
      reasonGeneratedKey: 'rec_reason_pollutant_dust',
      reasonGeneratedParams: { pm10: pollutants.pm10 },
      reconsiderWhenKey: 'reconsider_when_aqi_drops',
      evidenceTrail: {
        evidenceMetric: `PM10 = ${pollutants.pm10} µg/m³ (> 100 coarse dust threshold)`,
        ruleTriggered: 'POLLUTANT_COARSE_DUST',
        householdContext: 'Dust-heavy roads/construction corridor',
        reconsiderWhenKey: 'reconsider_when_aqi_drops',
      },
      severity: 'advisory',
    });
  }

  return recs;
}

export function buildSensitivityRecommendations(
  input: EngineInput,
  bundle: EvidenceBundle,
  allMemberNames: string[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const sensitivityTags = new Set<SensitivityTag>(input.household.sensitivityTags ?? []);
  const measuredAt = input.primarySnapshot?.measuredAt ?? null;
  const pollutants = input.primarySnapshot?.pollutants ?? {};
  const { aqiBand, aqiValue } = bundle;

  if (
    sensitivityTags.has('dust_sensitive') &&
    ((typeof pollutants.pm10 === 'number' && pollutants.pm10 > 100) ||
      (typeof pollutants.pm25 === 'number' && pollutants.pm25 > 60))
  ) {
    recs.push({
      id: 'rec-sens-dust',
      titleKey: 'rec_sens_dust_title',
      explanationKey: 'rec_sens_dust_expl',
      explanationParams: { pm10: pollutants.pm10 ?? 'N/A', pm25: pollutants.pm25 ?? 'N/A' },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: 'rec_sens_dust_action',
      reasonGeneratedKey: 'rec_reason_sensitivity_tag',
      reasonGeneratedParams: { tag: 'dust_sensitive' },
      reconsiderWhenKey: 'reconsider_when_aqi_drops',
      evidenceTrail: {
        evidenceMetric: `PM10 ${pollutants.pm10 ?? 'N/A'} / PM2.5 ${pollutants.pm25 ?? 'N/A'} µg/m³`,
        ruleTriggered: 'SENSITIVITY_DUST_COMFORT',
        householdContext: 'Household preference: Dust-sensitive environment',
        reconsiderWhenKey: 'reconsider_when_aqi_drops',
      },
      severity: 'caution',
    });
  }

  if (sensitivityTags.has('respiratory_comfort') && aqiBand !== 'good') {
    recs.push({
      id: 'rec-sens-respiratory',
      titleKey: 'rec_sens_resp_title',
      explanationKey: 'rec_sens_resp_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: 'rec_sens_resp_action',
      reasonGeneratedKey: 'rec_reason_sensitivity_tag',
      reasonGeneratedParams: { tag: 'respiratory_comfort' },
      reconsiderWhenKey: 'reconsider_when_aqi_drops',
      evidenceTrail: {
        evidenceMetric: `NAQI ${aqiValue ?? 'N/A'} (> 50 threshold for extra respiratory comfort)`,
        ruleTriggered: 'SENSITIVITY_RESPIRATORY_COMFORT',
        householdContext: 'Household preference: Extra respiratory comfort care',
        reconsiderWhenKey: 'reconsider_when_aqi_drops',
      },
      severity: aqiBand === 'satisfactory' ? 'advisory' : 'caution',
    });
  }

  if (
    sensitivityTags.has('early_commute_exposure') &&
    aqiBand !== 'good' &&
    input.routines.some((r) => r.environment === 'outdoor' && r.preferredWindow === '06:00-09:00')
  ) {
    recs.push({
      id: 'rec-sens-commute',
      titleKey: 'rec_sens_commute_title',
      explanationKey: 'rec_sens_commute_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: 'rec_sens_commute_action',
      reasonGeneratedKey: 'rec_reason_sensitivity_tag',
      reasonGeneratedParams: { tag: 'early_commute_exposure' },
      reconsiderWhenKey: 'reconsider_when_traffic_eases',
      evidenceTrail: {
        evidenceMetric: `NAQI ${aqiValue ?? 'N/A'} during 06:00-09:00 outdoor commitment`,
        ruleTriggered: 'SENSITIVITY_EARLY_COMMUTE',
        householdContext: 'Household preference: Early morning commute buffering',
        reconsiderWhenKey: 'reconsider_when_traffic_eases',
      },
      severity: 'advisory',
    });
  }

  return recs;
}
