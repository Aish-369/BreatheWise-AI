import type {
  ActivityRoutine,
  EnvironmentalSnapshot,
  ForecastSlot,
  ProtectionPlanResult,
  ScenarioComparisonResult,
  ScenarioModification,
} from '../../shared/types';
import { SCENARIO_BANNER } from './summary';
import type { EngineInput } from './types';

function createBaseScenarioSnapshot(
  baseSnap: EnvironmentalSnapshot | null,
  city: string,
  nowIso: string
): EnvironmentalSnapshot {
  if (baseSnap) {
    return {
      ...baseSnap,
      id: `${baseSnap.id}-scenario`,
      dataType: 'hypothetical_scenario',
      providerLabel: `Hypothetical Scenario (${baseSnap.providerLabel} baseline)`,
      isDemoFixture: false,
      pollutants: { ...baseSnap.pollutants },
      warnings: ['SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT.', ...baseSnap.warnings],
    };
  }
  return {
    id: 'scenario-synthetic',
    provider: 'demo_fixture',
    providerLabel: 'Hypothetical Scenario Input',
    dataType: 'hypothetical_scenario',
    classification: 'unavailable',
    city,
    locationLabel: city,
    stationOrGridId: 'SCENARIO-INPUT',
    spatialResolutionNote: 'Hypothetical input — not an observed reading',
    pollutants: { pm25: 55, pm10: 95 },
    reportedAqiIndia: null,
    measuredAt: nowIso,
    retrievedAt: nowIso,
    freshness: 'fresh',
    licenseAttribution: 'User-defined hypothetical scenario',
    warnings: ['SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT.'],
    isDemoFixture: false,
    isAvailable: true,
  };
}

export function buildScenarioSnapshot(
  baselineInput: EngineInput,
  modification: ScenarioModification,
  nowIso: string
): EnvironmentalSnapshot {
  const snap = createBaseScenarioSnapshot(
    baselineInput.primarySnapshot,
    baselineInput.household.city,
    nowIso
  );
  if (modification.simulateUnavailable) {
    return {
      ...snap,
      isAvailable: false,
      freshness: 'unavailable',
      classification: 'unavailable',
      measuredAt: null,
    };
  }
  if (typeof modification.pm25Override === 'number') {
    snap.pollutants.pm25 = modification.pm25Override;
    snap.reportedAqiIndia = null;
    snap.isAvailable = true;
  }
  if (typeof modification.pm10Override === 'number') {
    snap.pollutants.pm10 = modification.pm10Override;
    snap.reportedAqiIndia = null;
    snap.isAvailable = true;
  }
  if (typeof modification.aqiOverride === 'number') {
    snap.reportedAqiIndia = modification.aqiOverride;
    snap.isAvailable = true;
  }
  if (modification.simulateStale) {
    snap.measuredAt = new Date(Date.parse(nowIso) - 10 * 60 * 60 * 1000).toISOString();
    snap.freshness = 'stale';
  } else if (snap.isAvailable && !snap.measuredAt) {
    snap.measuredAt = nowIso;
    snap.freshness = 'fresh';
  }
  return snap;
}

export function applyRoutineOverrides(
  routines: ActivityRoutine[],
  modification: ScenarioModification
): ActivityRoutine[] {
  return routines.map((r) =>
    modification.overrideRoutineId && r.id === modification.overrideRoutineId
      ? {
          ...r,
          preferredWindow: modification.overrideWindow ?? r.preferredWindow,
          environment: modification.overrideEnvironment ?? r.environment,
        }
      : r
  );
}

export function applyForecastOverrides(
  forecastSlots: ForecastSlot[],
  modification: ScenarioModification
): ForecastSlot[] {
  if (!modification.forecastTrendOverride || modification.forecastTrendOverride === 'none') {
    return [...forecastSlots];
  }
  if (modification.forecastTrendOverride === 'worsening') {
    return forecastSlots.map((f) => ({
      ...f,
      expectedPm25: f.expectedPm25 !== null ? Math.round(f.expectedPm25 * 1.45) : 140,
      expectedAqiIndia:
        f.expectedAqiIndia !== null ? Math.min(480, Math.round(f.expectedAqiIndia * 1.45)) : 260,
      trend: 'worsening',
    }));
  }
  if (modification.forecastTrendOverride === 'improving') {
    return forecastSlots.map((f) => ({
      ...f,
      expectedPm25:
        f.timeWindow === '12:00-16:00' || f.timeWindow === '16:00-19:00'
          ? 32
          : f.expectedPm25 !== null
            ? Math.max(25, Math.round(f.expectedPm25 * 0.7))
            : 40,
      expectedAqiIndia:
        f.timeWindow === '12:00-16:00' || f.timeWindow === '16:00-19:00'
          ? 55
          : f.expectedAqiIndia !== null
            ? Math.max(45, Math.round(f.expectedAqiIndia * 0.7))
            : 70,
      trend: 'improving',
    }));
  }
  return [...forecastSlots];
}

export function computeScenarioComparison(
  baselinePlan: ProtectionPlanResult,
  scenarioPlan: ProtectionPlanResult,
  modification: ScenarioModification,
  nowIso: string
): ScenarioComparisonResult {
  const baselineRecIds = new Set(
    baselinePlan.recommendations.map((r) => `${r.id}:${r.severity}:${r.titleKey}`)
  );
  const scenarioRecIds = new Set(
    scenarioPlan.recommendations.map((r) => `${r.id}:${r.severity}:${r.titleKey}`)
  );
  let changedRecommendationsCount = 0;
  for (const key of scenarioRecIds) {
    if (!baselineRecIds.has(key)) changedRecommendationsCount++;
  }

  let changedScheduleCount = 0;
  for (const sItem of scenarioPlan.dailyPlan) {
    const bItem = baselinePlan.dailyPlan.find((b) => b.routineId === sItem.routineId);
    if (
      !bItem ||
      bItem.status !== sItem.status ||
      bItem.suggestedWindow !== sItem.suggestedWindow ||
      bItem.environment !== sItem.environment
    ) {
      changedScheduleCount++;
    }
  }

  const changeSummaryKeys: string[] = [];
  if (baselinePlan.aqiBand !== scenarioPlan.aqiBand) {
    changeSummaryKeys.push('scenario_diff_band_shifted');
  }
  if (changedScheduleCount > 0) {
    changeSummaryKeys.push('scenario_diff_schedule_adjusted');
  }
  if (modification.simulateUnavailable || modification.simulateStale) {
    changeSummaryKeys.push('scenario_diff_confidence_dropped');
  }
  if (changeSummaryKeys.length === 0) {
    changeSummaryKeys.push('scenario_diff_no_material_shift');
  }

  return {
    id: `scen-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: nowIso,
    isScenario: true,
    disclaimerBanner: SCENARIO_BANNER,
    modification,
    baselinePlan,
    scenarioPlan,
    changedRecommendationsCount,
    changedScheduleCount,
    changeSummaryKeys,
  };
}
