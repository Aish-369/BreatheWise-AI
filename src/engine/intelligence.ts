import type {
  ProtectionPlanResult,
  ScenarioComparisonResult,
  ScenarioModification,
} from '../shared/types';
import { buildAllRecommendations, buildUnavailableRecommendation } from './plan/actions';
import { buildDailyPlanItems, buildUnavailableDailyPlan } from './plan/dailyPlan';
import { collectPlanEvidence } from './plan/evidence';
import { groupHouseholdMembers } from './plan/riskScoring';
import {
  applyForecastOverrides,
  applyRoutineOverrides,
  buildScenarioSnapshot,
  computeScenarioComparison,
} from './plan/scenario';
import { buildProtectionPlanResult, buildUnavailablePlanResult } from './plan/summary';
import type { EngineInput } from './plan/types';

export const RULE_SET_VERSION = '2.0.0';
export type { EngineInput };

export function generateProtectionPlan(input: EngineInput): ProtectionPlanResult {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const bundle = collectPlanEvidence(input, nowIso);
  const groups = groupHouseholdMembers(input.members);

  if (!bundle.isAvailable || bundle.aqiBand === 'unavailable') {
    const recommendations = [buildUnavailableRecommendation(input, bundle, groups.allMemberNames)];
    const dailyPlan = buildUnavailableDailyPlan(input, bundle.todayDate);
    return buildUnavailablePlanResult(input, bundle, RULE_SET_VERSION, recommendations, dailyPlan);
  }

  const recommendations = buildAllRecommendations(input, bundle, groups);
  const dailyPlan = buildDailyPlanItems(input, bundle);
  return buildProtectionPlanResult(input, bundle, RULE_SET_VERSION, recommendations, dailyPlan);
}

export function runWhatIfScenario(
  baselineInput: EngineInput,
  modification: ScenarioModification
): ScenarioComparisonResult {
  const nowIso = baselineInput.nowIso ?? new Date().toISOString();
  const baselinePlan = generateProtectionPlan({
    ...baselineInput,
    nowIso,
    isScenario: false,
  });

  const scenarioSnapshot = buildScenarioSnapshot(baselineInput, modification, nowIso);
  const modifiedRoutines = applyRoutineOverrides(baselineInput.routines, modification);
  const modifiedForecasts = applyForecastOverrides(baselineInput.forecastSlots ?? [], modification);

  const scenarioPlan = generateProtectionPlan({
    ...baselineInput,
    routines: modifiedRoutines,
    primarySnapshot: scenarioSnapshot,
    secondarySnapshots: [],
    historicalSnapshots: [],
    forecastSlots: modifiedForecasts,
    nowIso,
    isScenario: true,
  });

  return computeScenarioComparison(baselinePlan, scenarioPlan, modification, nowIso);
}
