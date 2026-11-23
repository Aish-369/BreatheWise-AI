import type { DailyPlanItem, ProtectionPlanResult, Recommendation } from '../../shared/types';
import type { EngineInput, EvidenceBundle } from './types';

export const SCENARIO_BANNER = 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT' as const;

export function buildUnavailablePlanResult(
  input: EngineInput,
  bundle: EvidenceBundle,
  ruleSetVersion: string,
  recommendations: Recommendation[],
  dailyPlan: DailyPlanItem[]
): ProtectionPlanResult {
  return {
    id: `plan-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    generatedAt: bundle.nowIso,
    city: input.household.city,
    aqiValue: null,
    aqiIsDerived: false,
    aqiBand: 'unavailable',
    dominantPollutant: null,
    freshness: 'unavailable',
    dataType: input.primarySnapshot?.dataType ?? 'physical_station',
    classification: bundle.classification,
    ruleSetVersion,
    historicalTrend: bundle.historicalTrend,
    isAvailable: false,
    isDemoFixture: input.primarySnapshot?.isDemoFixture ?? false,
    isScenario: Boolean(input.isScenario),
    scenarioLabel: input.isScenario ? SCENARIO_BANNER : undefined,
    conflictWarningKey: null,
    conflictDetails: null,
    summaryKey: 'summary_unavailable',
    summaryParams: { city: input.household.city },
    limitations: bundle.limitations,
    recommendations,
    dailyPlan,
    supportingEvidence: bundle.evidence,
  };
}

export function buildProtectionPlanResult(
  input: EngineInput,
  bundle: EvidenceBundle,
  ruleSetVersion: string,
  recommendations: Recommendation[],
  dailyPlan: DailyPlanItem[]
): ProtectionPlanResult {
  return {
    id: `plan-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    generatedAt: bundle.nowIso,
    city: input.household.city,
    aqiValue: bundle.aqiValue,
    aqiIsDerived: bundle.validation.derivedAqi.isDerived,
    aqiBand: bundle.aqiBand,
    dominantPollutant: bundle.dominantPollutant,
    freshness: bundle.freshness,
    dataType: input.primarySnapshot?.dataType ?? 'physical_station',
    classification: bundle.classification,
    ruleSetVersion,
    historicalTrend: bundle.historicalTrend,
    isAvailable: true,
    isDemoFixture: input.primarySnapshot?.isDemoFixture ?? false,
    isScenario: Boolean(input.isScenario),
    scenarioLabel: input.isScenario ? SCENARIO_BANNER : undefined,
    conflictWarningKey: bundle.conflict.conflictWarningKey,
    conflictDetails: bundle.conflict.details,
    summaryKey: `summary_${bundle.aqiBand}`,
    summaryParams: {
      city: input.household.city,
      aqi: bundle.aqiValue ?? 0,
      memberCount: input.members.length,
    },
    limitations: bundle.limitations,
    recommendations,
    dailyPlan,
    supportingEvidence: bundle.evidence,
  };
}
