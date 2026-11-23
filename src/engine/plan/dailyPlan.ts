import type { ActivityRoutine, DailyPlanItem, SensitivityTag } from '../../shared/types';
import { findCleanerForecastWindow } from './windowSelection';
import type { EngineInput, EvidenceBundle } from './types';

export function buildUnavailableDailyPlan(input: EngineInput, todayDate: string): DailyPlanItem[] {
  return input.routines.map((routine): DailyPlanItem => ({
    routineId: routine.id,
    routineTitle: routine.title,
    environment: routine.environment,
    flexibility: routine.flexibility,
    originalWindow: routine.preferredWindow,
    suggestedWindow: null,
    status: routine.environment === 'indoor' ? 'proceed_as_planned' : 'hold_pending_data',
    applicableMembers: input.members
      .filter((m) => routine.memberIds.includes(m.id))
      .map((m) => m.name),
    rationaleKey:
      routine.environment === 'indoor' ? 'plan_indoor_unaffected' : 'plan_hold_unavailable',
    limitationKey: 'evidence_unavailable',
    evidenceTimestamp: null,
    notes: routine.notes ?? '',
    completedToday: routine.completedDate === todayDate,
  }));
}

function evaluateOutdoorFlexibleRoutine(
  routine: ActivityRoutine,
  memberNames: string[],
  hasSensitiveAge: boolean,
  bundle: EvidenceBundle,
  input: EngineInput,
  commonMeta: { notes: string; completedToday: boolean }
): DailyPlanItem {
  const evidenceTimestamp = input.primarySnapshot?.measuredAt ?? null;
  const { aqiBand, aqiValue, forecasts } = bundle;
  const cleanerOption = findCleanerForecastWindow(
    routine.preferredWindow,
    forecasts,
    aqiValue,
    input.primarySnapshot?.pollutants.pm25 ?? null
  );
  const noForecastLimit = forecasts.length === 0 ? 'no_verified_forecast' : 'coarse_grid_forecast';

  if (
    aqiBand === 'very_poor' ||
    aqiBand === 'severe' ||
    (aqiBand === 'poor' && hasSensitiveAge && !cleanerOption)
  ) {
    return {
      routineId: routine.id,
      routineTitle: routine.title,
      environment: 'outdoor',
      flexibility: 'flexible',
      originalWindow: routine.preferredWindow,
      suggestedWindow: null,
      status: 'move_indoors',
      applicableMembers: memberNames,
      rationaleKey: 'plan_flexible_move_indoors',
      rationaleParams: { aqi: aqiValue ?? 0 },
      limitationKey: noForecastLimit,
      evidenceTimestamp,
      ...commonMeta,
    };
  }

  if (cleanerOption && (cleanerOption.slot.expectedAqiIndia ?? 200) <= 200) {
    return {
      routineId: routine.id,
      routineTitle: routine.title,
      environment: 'outdoor',
      flexibility: 'flexible',
      originalWindow: routine.preferredWindow,
      suggestedWindow: cleanerOption.window,
      status: 'adjust_window',
      applicableMembers: memberNames,
      rationaleKey: 'plan_flexible_shift_window',
      rationaleParams: {
        window: cleanerOption.window,
        pm25: cleanerOption.slot.expectedPm25 ?? 'N/A',
      },
      limitationKey: 'coarse_grid_forecast',
      evidenceTimestamp,
      ...commonMeta,
    };
  }

  return {
    routineId: routine.id,
    routineTitle: routine.title,
    environment: 'outdoor',
    flexibility: 'flexible',
    originalWindow: routine.preferredWindow,
    suggestedWindow: null,
    status: aqiBand === 'poor' ? 'move_indoors' : 'proceed_with_precautions',
    applicableMembers: memberNames,
    rationaleKey:
      forecasts.length === 0 ? 'plan_no_forecast_window' : 'plan_no_cleaner_window_found',
    rationaleParams: { aqi: aqiValue ?? 0 },
    limitationKey: noForecastLimit,
    evidenceTimestamp,
    ...commonMeta,
  };
}

function evaluateRoutineItem(
  routine: ActivityRoutine,
  input: EngineInput,
  bundle: EvidenceBundle,
  hasHouseholdSensitivity: boolean
): DailyPlanItem {
  const assignedMembers = input.members.filter((m) => routine.memberIds.includes(m.id));
  const memberNames = assignedMembers.map((m) => m.name);
  const hasSensitiveAge =
    hasHouseholdSensitivity ||
    assignedMembers.some(
      (m) =>
        m.ageGroup === 'infant_toddler' ||
        m.ageGroup === 'school_child' ||
        m.ageGroup === 'older_adult'
    );
  const evidenceTimestamp = input.primarySnapshot?.measuredAt ?? null;
  const commonMeta = {
    notes: routine.notes ?? '',
    completedToday: routine.completedDate === bundle.todayDate,
  };

  if (routine.environment === 'indoor') {
    return {
      routineId: routine.id,
      routineTitle: routine.title,
      environment: 'indoor',
      flexibility: routine.flexibility,
      originalWindow: routine.preferredWindow,
      suggestedWindow: null,
      status: 'proceed_as_planned',
      applicableMembers: memberNames,
      rationaleKey:
        bundle.aqiBand === 'poor' || bundle.aqiBand === 'very_poor' || bundle.aqiBand === 'severe'
          ? 'plan_indoor_keep_closed'
          : 'plan_indoor_unaffected',
      limitationKey: null,
      evidenceTimestamp,
      ...commonMeta,
    };
  }

  if (bundle.freshness === 'stale') {
    return {
      routineId: routine.id,
      routineTitle: routine.title,
      environment: 'outdoor',
      flexibility: routine.flexibility,
      originalWindow: routine.preferredWindow,
      suggestedWindow: null,
      status: 'hold_pending_data',
      applicableMembers: memberNames,
      rationaleKey: 'plan_stale_verify_first',
      limitationKey: 'low_stale',
      evidenceTimestamp,
      ...commonMeta,
    };
  }

  if (bundle.aqiBand === 'good' || (bundle.aqiBand === 'satisfactory' && !hasSensitiveAge)) {
    return {
      routineId: routine.id,
      routineTitle: routine.title,
      environment: 'outdoor',
      flexibility: routine.flexibility,
      originalWindow: routine.preferredWindow,
      suggestedWindow: null,
      status: 'proceed_as_planned',
      applicableMembers: memberNames,
      rationaleKey: 'plan_outdoor_favorable',
      rationaleParams: { aqi: bundle.aqiValue ?? 0 },
      limitationKey: null,
      evidenceTimestamp,
      ...commonMeta,
    };
  }

  if (routine.flexibility === 'fixed') {
    return {
      routineId: routine.id,
      routineTitle: routine.title,
      environment: 'outdoor',
      flexibility: 'fixed',
      originalWindow: routine.preferredWindow,
      suggestedWindow: null,
      status: 'proceed_with_precautions',
      applicableMembers: memberNames,
      rationaleKey:
        bundle.aqiBand === 'very_poor' || bundle.aqiBand === 'severe'
          ? 'plan_fixed_high_precaution'
          : 'plan_fixed_moderate_precaution',
      rationaleParams: { aqi: bundle.aqiValue ?? 0 },
      limitationKey: null,
      evidenceTimestamp,
      ...commonMeta,
    };
  }

  return evaluateOutdoorFlexibleRoutine(
    routine,
    memberNames,
    hasSensitiveAge,
    bundle,
    input,
    commonMeta
  );
}

export function buildDailyPlanItems(input: EngineInput, bundle: EvidenceBundle): DailyPlanItem[] {
  const sensitivityTags = new Set<SensitivityTag>(input.household.sensitivityTags ?? []);
  const hasHouseholdSensitivity = sensitivityTags.size > 0;
  return input.routines.map((routine) =>
    evaluateRoutineItem(routine, input, bundle, hasHouseholdSensitivity)
  );
}
