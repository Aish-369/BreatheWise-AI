import type { Recommendation } from '../../shared/types';
import {
  buildElderAndAdultRecommendations,
  buildInfantAndChildRecommendations,
  buildPollutantRecommendations,
  buildSensitivityRecommendations,
} from './contextActions';
import { bandToSeverity } from './riskScoring';
import type { EngineInput, EvidenceBundle, MemberGroups } from './types';

export function buildUnavailableRecommendation(
  input: EngineInput,
  bundle: EvidenceBundle,
  allMemberNames: string[]
): Recommendation {
  return {
    id: 'rec-unavailable',
    titleKey: 'rec_unavailable_title',
    explanationKey: 'rec_unavailable_expl',
    applicableMembers: allMemberNames,
    supportingEvidence: bundle.evidence,
    sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
    confidenceOrLimitationKey: 'evidence_unavailable',
    suggestedActionKey: 'rec_unavailable_action',
    reasonGeneratedKey: 'rec_unavailable_reason',
    reconsiderWhenKey: 'reconsider_when_fresh_station',
    evidenceTrail: {
      evidenceMetric: 'Station & timestamp check failed or unconfigured',
      ruleTriggered: 'SAFEGUARD_UNAVAILABLE_EVIDENCE',
      householdContext: `${allMemberNames.length} household member(s) in ${input.household.city}`,
      reconsiderWhenKey: 'reconsider_when_fresh_station',
    },
    severity: 'unavailable',
  };
}

function buildSafeguardRecommendations(
  input: EngineInput,
  bundle: EvidenceBundle,
  allMemberNames: string[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const measuredAt = input.primarySnapshot?.measuredAt ?? null;
  if (bundle.freshness === 'stale') {
    recs.push({
      id: 'rec-stale-warning',
      titleKey: 'rec_stale_title',
      explanationKey: 'rec_stale_expl',
      explanationParams: { city: input.household.city },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: 'low_stale',
      suggestedActionKey: 'rec_stale_action',
      reasonGeneratedKey: 'rec_stale_reason',
      reconsiderWhenKey: 'reconsider_when_fresh_station',
      evidenceTrail: {
        evidenceMetric: `Measurement age > 6h (${measuredAt ?? 'unknown'})`,
        ruleTriggered: 'SAFEGUARD_STALE_OBSERVATION',
        householdContext: `${allMemberNames.length} household member(s)`,
        reconsiderWhenKey: 'reconsider_when_fresh_station',
      },
      severity: 'caution',
    });
  }
  if (bundle.conflict.hasConflict) {
    recs.push({
      id: 'rec-conflict',
      titleKey: 'rec_conflict_title',
      explanationKey: 'rec_conflict_expl',
      explanationParams: { details: bundle.conflict.details ?? '' },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: 'provider_conflict',
      suggestedActionKey: 'rec_conflict_action',
      reasonGeneratedKey: 'rec_conflict_reason',
      reconsiderWhenKey: 'reconsider_when_stations_align',
      evidenceTrail: {
        evidenceMetric:
          bundle.conflict.details ?? 'Cross-station divergence >= 35 AQI or >= 35% PM2.5',
        ruleTriggered: 'CROSS_STATION_CONFLICT_CHECK',
        householdContext: `City-wide comparison in ${input.household.city}`,
        reconsiderWhenKey: 'reconsider_when_stations_align',
      },
      severity: 'caution',
    });
  }
  return recs;
}

function buildBandRecommendation(
  input: EngineInput,
  bundle: EvidenceBundle,
  allMemberNames: string[]
): Recommendation {
  const { aqiBand, aqiValue, dominantPollutant } = bundle;
  const reconsiderWhenKey =
    aqiBand === 'good' ? 'reconsider_when_aqi_rises' : 'reconsider_when_aqi_drops';
  return {
    id: 'rec-household-general',
    titleKey: `rec_band_${aqiBand}_title`,
    titleParams: { aqi: aqiValue ?? 0, city: input.household.city },
    explanationKey: `rec_band_${aqiBand}_expl`,
    explanationParams: {
      aqi: aqiValue ?? 0,
      pollutant: dominantPollutant ?? 'PM2.5',
      pm25: input.primarySnapshot?.pollutants.pm25 ?? 'N/A',
    },
    applicableMembers: allMemberNames,
    supportingEvidence: bundle.evidence,
    sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
    confidenceOrLimitationKey: bundle.confidence,
    suggestedActionKey: `rec_band_${aqiBand}_action`,
    reasonGeneratedKey: 'rec_reason_aqi_threshold',
    reasonGeneratedParams: {
      aqi: aqiValue ?? 0,
      band: aqiBand,
      pollutant: dominantPollutant ?? 'PM2.5',
    },
    reconsiderWhenKey,
    evidenceTrail: {
      evidenceMetric: `NAQI ${aqiValue ?? 'N/A'} (${aqiBand}), dominant ${dominantPollutant ?? 'N/A'}`,
      ruleTriggered: `NAQI_BAND_${aqiBand.toUpperCase()}`,
      householdContext: `${allMemberNames.length} household member(s) in ${input.household.city}`,
      reconsiderWhenKey,
    },
    severity: bandToSeverity(aqiBand),
  };
}

function buildTrendAndVentilationRecommendations(
  input: EngineInput,
  bundle: EvidenceBundle,
  allMemberNames: string[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const measuredAt = input.primarySnapshot?.measuredAt ?? null;
  const { historicalTrend, aqiBand, aqiValue } = bundle;

  if (
    historicalTrend &&
    historicalTrend.direction === 'worsening' &&
    (historicalTrend.deltaPm25 ?? 0) >= 15
  ) {
    recs.push({
      id: 'rec-historical-worsening',
      titleKey: 'rec_trend_worsening_title',
      titleParams: { delta: historicalTrend.deltaPm25 ?? 0 },
      explanationKey: 'rec_trend_worsening_expl',
      explanationParams: {
        prev: historicalTrend.previousPm25 ?? 0,
        latest: historicalTrend.latestPm25 ?? 0,
      },
      applicableMembers: allMemberNames,
      supportingEvidence: bundle.evidence,
      sourceTimestamp: measuredAt,
      confidenceOrLimitationKey: bundle.confidence,
      suggestedActionKey: 'rec_trend_worsening_action',
      reasonGeneratedKey: 'rec_reason_historical_trend',
      reasonGeneratedParams: { delta: historicalTrend.deltaPm25 ?? 0 },
      reconsiderWhenKey: 'reconsider_when_fresh_station',
      evidenceTrail: {
        evidenceMetric: `PM2.5 rose from ${historicalTrend.previousPm25} to ${historicalTrend.latestPm25} µg/m³ across ${historicalTrend.sampleCount} logged readings`,
        ruleTriggered: 'HISTORICAL_TREND_WORSENING',
        householdContext: `${input.household.city} session trend`,
        reconsiderWhenKey: 'reconsider_when_fresh_station',
      },
      severity: 'caution',
    });
  }

  const allowOpen = aqiBand === 'good' || aqiBand === 'satisfactory';
  recs.push({
    id: allowOpen ? 'rec-ventilation-open' : 'rec-ventilation-limit',
    titleKey: allowOpen ? 'rec_vent_open_title' : 'rec_vent_limit_title',
    explanationKey: allowOpen ? 'rec_vent_open_expl' : 'rec_vent_limit_expl',
    applicableMembers: allMemberNames,
    supportingEvidence: bundle.evidence,
    sourceTimestamp: measuredAt,
    confidenceOrLimitationKey: bundle.confidence,
    suggestedActionKey: allowOpen ? 'rec_vent_open_action' : 'rec_vent_limit_action',
    reasonGeneratedKey: 'rec_reason_ventilation',
    reconsiderWhenKey: allowOpen ? 'reconsider_when_aqi_rises' : 'reconsider_when_aqi_drops',
    evidenceTrail: {
      evidenceMetric: allowOpen
        ? `NAQI ${aqiValue ?? 'N/A'} (${aqiBand} allows cross-ventilation)`
        : `NAQI ${aqiValue ?? 'N/A'} (> 100 infiltration threshold)`,
      ruleTriggered: allowOpen ? 'INDOOR_VENTILATION_OPEN' : 'INDOOR_VENTILATION_LIMIT',
      householdContext: `All indoor living spaces in ${input.household.city}`,
      reconsiderWhenKey: allowOpen ? 'reconsider_when_aqi_rises' : 'reconsider_when_aqi_drops',
    },
    severity: allowOpen ? 'nominal' : aqiBand === 'moderate' ? 'advisory' : 'caution',
  });

  return recs;
}

export function buildAllRecommendations(
  input: EngineInput,
  bundle: EvidenceBundle,
  groups: MemberGroups
): Recommendation[] {
  return [
    ...buildSafeguardRecommendations(input, bundle, groups.allMemberNames),
    buildBandRecommendation(input, bundle, groups.allMemberNames),
    ...buildInfantAndChildRecommendations(input, bundle, groups),
    ...buildElderAndAdultRecommendations(input, bundle, groups),
    ...buildPollutantRecommendations(input, bundle, groups.allMemberNames),
    ...buildSensitivityRecommendations(input, bundle, groups.allMemberNames),
    ...buildTrendAndVentilationRecommendations(input, bundle, groups.allMemberNames),
  ];
}
