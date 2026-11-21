import type {
  ActivityRoutine,
  ConfidenceOrLimitationKey,
  DailyPlanItem,
  EnvironmentalSnapshot,
  FamilyMember,
  ForecastSlot,
  HouseholdProfile,
  ProtectionPlanResult,
  Recommendation,
  RecommendationSeverity,
  ScenarioComparisonResult,
  ScenarioModification,
  SupportingEvidence,
  TimeWindow,
} from '../shared/types';
import {
  aqiToBand,
  detectProviderConflict,
  validateEnvironmentalSnapshot,
} from './quality';

export interface EngineInput {
  household: HouseholdProfile;
  members: FamilyMember[];
  routines: ActivityRoutine[];
  primarySnapshot: EnvironmentalSnapshot | null;
  secondarySnapshots?: EnvironmentalSnapshot[];
  forecastSlots?: ForecastSlot[];
  nowIso?: string;
  isScenario?: boolean;
}

const WINDOW_ORDER: TimeWindow[] = [
  '06:00-09:00',
  '09:00-12:00',
  '12:00-16:00',
  '16:00-19:00',
  '19:00-22:00',
];

function buildEvidence(
  snapshot: EnvironmentalSnapshot | null,
  aqiValue: number | null,
  aqiIsDerived: boolean,
  freshness: SupportingEvidence['freshness']
): SupportingEvidence {
  return {
    providerLabel: snapshot?.providerLabel ?? 'No active provider',
    stationOrGridId: snapshot?.stationOrGridId ?? 'Unavailable',
    dataType: snapshot?.dataType ?? 'physical_station',
    measuredAt: snapshot?.measuredAt ?? null,
    retrievedAt: snapshot?.retrievedAt ?? new Date().toISOString(),
    freshness,
    pm25: snapshot?.pollutants.pm25 ?? null,
    pm10: snapshot?.pollutants.pm10 ?? null,
    aqiValue,
    aqiIsDerived,
    isDemoFixture: snapshot?.isDemoFixture ?? false,
  };
}

function findCleanerForecastWindow(
  currentWindow: TimeWindow,
  forecastSlots: ForecastSlot[],
  currentAqi: number | null,
  currentPm25: number | null
): { window: TimeWindow; slot: ForecastSlot } | null {
  if (!forecastSlots || forecastSlots.length === 0) return null;

  const validSlots = forecastSlots.filter(
    (s) =>
      (typeof s.expectedPm25 === 'number' && s.expectedPm25 >= 0) ||
      (typeof s.expectedAqiIndia === 'number' && s.expectedAqiIndia >= 0)
  );
  if (validSlots.length === 0) return null;

  const currentSlot = validSlots.find((s) => s.timeWindow === currentWindow);
  const baselinePm = currentSlot?.expectedPm25 ?? currentPm25;
  const baselineAqi = currentSlot?.expectedAqiIndia ?? currentAqi;

  // Rank candidates by lowest expected PM2.5 / AQI
  const sorted = [...validSlots].sort((a, b) => {
    const aScore = a.expectedPm25 ?? (a.expectedAqiIndia ?? 999);
    const bScore = b.expectedPm25 ?? (b.expectedAqiIndia ?? 999);
    if (aScore !== bScore) return aScore - bScore;
    return WINDOW_ORDER.indexOf(a.timeWindow) - WINDOW_ORDER.indexOf(b.timeWindow);
  });

  const best = sorted[0];
  if (!best || best.timeWindow === currentWindow) return null;

  const pmImproved =
    baselinePm !== null &&
    best.expectedPm25 !== null &&
    best.expectedPm25 <= baselinePm * 0.82 &&
    baselinePm - best.expectedPm25 >= 8;

  const aqiImproved =
    baselineAqi !== null &&
    best.expectedAqiIndia !== null &&
    best.expectedAqiIndia <= baselineAqi - 25;

  if (pmImproved || aqiImproved) {
    return { window: best.timeWindow, slot: best };
  }

  return null;
}

export function generateProtectionPlan(input: EngineInput): ProtectionPlanResult {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const secondary = input.secondarySnapshots ?? [];
  const forecasts = (input.forecastSlots ?? []).filter(
    (f) => f.city.toLowerCase() === input.household.city.toLowerCase()
  );

  const validation = validateEnvironmentalSnapshot(input.primarySnapshot, nowIso);
  const conflict = detectProviderConflict(input.primarySnapshot, secondary, nowIso);

  const aqiValue = validation.derivedAqi.aqi;
  const aqiBand = validation.derivedAqi.band;
  const dominantPollutant = validation.derivedAqi.dominantPollutant;
  const freshness = validation.freshness;
  const isAvailable = Boolean(input.primarySnapshot?.isAvailable) && validation.valid;
  const evidence = buildEvidence(
    input.primarySnapshot,
    aqiValue,
    validation.derivedAqi.isDerived,
    freshness
  );

  const limitations: string[] = [...validation.warnings];
  if (conflict.hasConflict && conflict.details) {
    limitations.push(conflict.details);
  }
  if (forecasts.length === 0) {
    limitations.push('No verified forecast series is loaded for this city; alternative time windows cannot be projected.');
  } else {
    limitations.push('Forecast guidance uses coarse grid estimates and cannot establish street-level air safety.');
  }

  let confidence: ConfidenceOrLimitationKey = 'high_station_fresh';
  if (input.isScenario) {
    confidence = 'hypothetical_simulation';
  } else if (!isAvailable) {
    confidence = 'evidence_unavailable';
  } else if (conflict.hasConflict) {
    confidence = 'provider_conflict';
  } else if (freshness === 'stale') {
    confidence = 'low_stale';
  } else if (freshness === 'aging') {
    confidence = 'moderate_aging';
  } else if (validation.missingPrimaryParticulates || input.primarySnapshot?.pollutants.pm25 == null) {
    confidence = 'partial_pollutants';
  }

  const memberNamesByGroup = {
    infant_toddler: input.members.filter((m) => m.ageGroup === 'infant_toddler').map((m) => m.name),
    school_child: input.members.filter((m) => m.ageGroup === 'school_child').map((m) => m.name),
    adult: input.members.filter((m) => m.ageGroup === 'adult').map((m) => m.name),
    older_adult: input.members.filter((m) => m.ageGroup === 'older_adult').map((m) => m.name),
  };

  const allMemberNames = input.members.map((m) => m.name);
  const recommendations: Recommendation[] = [];

  // 1. Handle unavailable or invalid evidence safely
  if (!isAvailable || aqiBand === 'unavailable') {
    recommendations.push({
      id: 'rec-unavailable',
      titleKey: 'rec_unavailable_title',
      explanationKey: 'rec_unavailable_expl',
      applicableMembers: allMemberNames,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: 'evidence_unavailable',
      suggestedActionKey: 'rec_unavailable_action',
      reasonGeneratedKey: 'rec_unavailable_reason',
      severity: 'unavailable',
    });

    const dailyPlan: DailyPlanItem[] = input.routines.map((routine) => ({
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
    }));

    return {
      id: `plan-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      generatedAt: nowIso,
      city: input.household.city,
      aqiValue: null,
      aqiIsDerived: false,
      aqiBand: 'unavailable',
      dominantPollutant: null,
      freshness: 'unavailable',
      dataType: input.primarySnapshot?.dataType ?? 'physical_station',
      isAvailable: false,
      isDemoFixture: input.primarySnapshot?.isDemoFixture ?? false,
      isScenario: Boolean(input.isScenario),
      scenarioLabel: input.isScenario ? 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT' : undefined,
      conflictWarningKey: null,
      conflictDetails: null,
      summaryKey: 'summary_unavailable',
      summaryParams: { city: input.household.city },
      limitations: Array.from(new Set(limitations)),
      recommendations,
      dailyPlan,
      supportingEvidence: evidence,
    };
  }

  // 2. Stale data safeguard
  if (freshness === 'stale') {
    recommendations.push({
      id: 'rec-stale-warning',
      titleKey: 'rec_stale_title',
      explanationKey: 'rec_stale_expl',
      explanationParams: { city: input.household.city },
      applicableMembers: allMemberNames,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: 'low_stale',
      suggestedActionKey: 'rec_stale_action',
      reasonGeneratedKey: 'rec_stale_reason',
      severity: 'caution',
    });
  }

  // 3. Conflicting providers notice
  if (conflict.hasConflict) {
    recommendations.push({
      id: 'rec-conflict',
      titleKey: 'rec_conflict_title',
      explanationKey: 'rec_conflict_expl',
      explanationParams: { details: conflict.details ?? '' },
      applicableMembers: allMemberNames,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: 'provider_conflict',
      suggestedActionKey: 'rec_conflict_action',
      reasonGeneratedKey: 'rec_conflict_reason',
      severity: 'caution',
    });
  }

  // 4. Household-wide severity recommendation based on NAQI Band
  const bandSeverity: RecommendationSeverity =
    aqiBand === 'good' || aqiBand === 'satisfactory'
      ? 'nominal'
      : aqiBand === 'moderate'
        ? 'advisory'
        : aqiBand === 'poor'
          ? 'caution'
          : 'elevated';

  recommendations.push({
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
    supportingEvidence: evidence,
    sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
    confidenceOrLimitationKey: confidence,
    suggestedActionKey: `rec_band_${aqiBand}_action`,
    reasonGeneratedKey: 'rec_reason_aqi_threshold',
    reasonGeneratedParams: {
      aqi: aqiValue ?? 0,
      band: aqiBand,
      pollutant: dominantPollutant ?? 'PM2.5',
    },
    severity: bandSeverity,
  });

  // 5. Age-group specific precautionary guidance (non-medical)
  if (memberNamesByGroup.infant_toddler.length > 0 && aqiBand !== 'good') {
    recommendations.push({
      id: 'rec-infant-toddler',
      titleKey: 'rec_infant_title',
      explanationKey: aqiBand === 'satisfactory' ? 'rec_infant_low_expl' : 'rec_infant_high_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: memberNamesByGroup.infant_toddler,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: confidence,
      suggestedActionKey: aqiBand === 'satisfactory' ? 'rec_infant_low_action' : 'rec_infant_high_action',
      reasonGeneratedKey: 'rec_reason_age_sensitivity',
      reasonGeneratedParams: { group: 'infant_toddler', aqi: aqiValue ?? 0 },
      severity: aqiBand === 'satisfactory' ? 'advisory' : 'elevated',
    });
  }

  if (memberNamesByGroup.school_child.length > 0 && (aqiBand === 'moderate' || aqiBand === 'poor' || aqiBand === 'very_poor' || aqiBand === 'severe')) {
    recommendations.push({
      id: 'rec-school-child',
      titleKey: 'rec_child_title',
      explanationKey: aqiBand === 'moderate' ? 'rec_child_mod_expl' : 'rec_child_high_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: memberNamesByGroup.school_child,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: confidence,
      suggestedActionKey: aqiBand === 'moderate' ? 'rec_child_mod_action' : 'rec_child_high_action',
      reasonGeneratedKey: 'rec_reason_age_sensitivity',
      reasonGeneratedParams: { group: 'school_child', aqi: aqiValue ?? 0 },
      severity: aqiBand === 'moderate' ? 'advisory' : 'caution',
    });
  }

  if (memberNamesByGroup.older_adult.length > 0 && (aqiBand === 'moderate' || aqiBand === 'poor' || aqiBand === 'very_poor' || aqiBand === 'severe')) {
    recommendations.push({
      id: 'rec-older-adult',
      titleKey: 'rec_elder_title',
      explanationKey: aqiBand === 'moderate' ? 'rec_elder_mod_expl' : 'rec_elder_high_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: memberNamesByGroup.older_adult,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: confidence,
      suggestedActionKey: aqiBand === 'moderate' ? 'rec_elder_mod_action' : 'rec_elder_high_action',
      reasonGeneratedKey: 'rec_reason_age_sensitivity',
      reasonGeneratedParams: { group: 'older_adult', aqi: aqiValue ?? 0 },
      severity: aqiBand === 'moderate' ? 'caution' : 'elevated',
    });
  }

  // 6. Active outdoor adults & commuters
  const activeOutdoorAdults = input.members
    .filter(
      (m) =>
        m.ageGroup === 'adult' &&
        (m.activityPreference === 'outdoor_exercise' ||
          m.activityPreference === 'morning_walk' ||
          m.activityPreference === 'commute')
    )
    .map((m) => m.name);

  if (activeOutdoorAdults.length > 0 && (aqiBand === 'moderate' || aqiBand === 'poor' || aqiBand === 'very_poor' || aqiBand === 'severe')) {
    recommendations.push({
      id: 'rec-active-adults',
      titleKey: 'rec_adult_active_title',
      explanationKey: 'rec_adult_active_expl',
      explanationParams: { aqi: aqiValue ?? 0 },
      applicableMembers: activeOutdoorAdults,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: confidence,
      suggestedActionKey: aqiBand === 'moderate' ? 'rec_adult_mod_action' : 'rec_adult_high_action',
      reasonGeneratedKey: 'rec_reason_activity_intensity',
      reasonGeneratedParams: { aqi: aqiValue ?? 0 },
      severity: aqiBand === 'moderate' ? 'advisory' : 'caution',
    });
  }

  // 7. Indoor ventilation guidance tied to outdoor levels
  if (aqiBand === 'good' || aqiBand === 'satisfactory') {
    recommendations.push({
      id: 'rec-ventilation-open',
      titleKey: 'rec_vent_open_title',
      explanationKey: 'rec_vent_open_expl',
      applicableMembers: allMemberNames,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: confidence,
      suggestedActionKey: 'rec_vent_open_action',
      reasonGeneratedKey: 'rec_reason_ventilation',
      severity: 'nominal',
    });
  } else {
    recommendations.push({
      id: 'rec-ventilation-limit',
      titleKey: 'rec_vent_limit_title',
      explanationKey: 'rec_vent_limit_expl',
      applicableMembers: allMemberNames,
      supportingEvidence: evidence,
      sourceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      confidenceOrLimitationKey: confidence,
      suggestedActionKey: 'rec_vent_limit_action',
      reasonGeneratedKey: 'rec_reason_ventilation',
      severity: aqiBand === 'moderate' ? 'advisory' : 'caution',
    });
  }

  // 8. Daily Protection Planner evaluation
  const dailyPlan: DailyPlanItem[] = input.routines.map((routine): DailyPlanItem => {
    const assignedMembers = input.members.filter((m) => routine.memberIds.includes(m.id));
    const memberNames = assignedMembers.map((m) => m.name);
    const hasSensitiveAge = assignedMembers.some(
      (m) => m.ageGroup === 'infant_toddler' || m.ageGroup === 'school_child' || m.ageGroup === 'older_adult'
    );

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
        rationaleKey: aqiBand === 'poor' || aqiBand === 'very_poor' || aqiBand === 'severe'
          ? 'plan_indoor_keep_closed'
          : 'plan_indoor_unaffected',
        limitationKey: null,
        evidenceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      };
    }

    // Outdoor routine
    if (freshness === 'stale') {
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
        evidenceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      };
    }

    if (aqiBand === 'good' || (aqiBand === 'satisfactory' && !hasSensitiveAge)) {
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
        rationaleParams: { aqi: aqiValue ?? 0 },
        limitationKey: null,
        evidenceTimestamp: input.primarySnapshot?.measuredAt ?? null,
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
          aqiBand === 'very_poor' || aqiBand === 'severe'
            ? 'plan_fixed_high_precaution'
            : 'plan_fixed_moderate_precaution',
        rationaleParams: { aqi: aqiValue ?? 0 },
        limitationKey: null,
        evidenceTimestamp: input.primarySnapshot?.measuredAt ?? null,
      };
    }

    // Flexible outdoor routine when AQI is elevated or sensitive groups are present
    const cleanerOption = findCleanerForecastWindow(
      routine.preferredWindow,
      forecasts,
      aqiValue,
      input.primarySnapshot?.pollutants.pm25 ?? null
    );

    if (
      (aqiBand === 'very_poor' || aqiBand === 'severe') ||
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
        limitationKey: forecasts.length === 0 ? 'no_verified_forecast' : 'coarse_grid_forecast',
        evidenceTimestamp: input.primarySnapshot?.measuredAt ?? null,
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
        evidenceTimestamp: input.primarySnapshot?.measuredAt ?? null,
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
        forecasts.length === 0
          ? 'plan_no_forecast_window'
          : 'plan_no_cleaner_window_found',
      rationaleParams: { aqi: aqiValue ?? 0 },
      limitationKey: forecasts.length === 0 ? 'no_verified_forecast' : 'coarse_grid_forecast',
      evidenceTimestamp: input.primarySnapshot?.measuredAt ?? null,
    };
  });

  return {
    id: `plan-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    generatedAt: nowIso,
    city: input.household.city,
    aqiValue,
    aqiIsDerived: validation.derivedAqi.isDerived,
    aqiBand,
    dominantPollutant,
    freshness,
    dataType: input.primarySnapshot?.dataType ?? 'physical_station',
    isAvailable: true,
    isDemoFixture: input.primarySnapshot?.isDemoFixture ?? false,
    isScenario: Boolean(input.isScenario),
    scenarioLabel: input.isScenario
      ? 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT'
      : undefined,
    conflictWarningKey: conflict.conflictWarningKey,
    conflictDetails: conflict.details,
    summaryKey: `summary_${aqiBand}`,
    summaryParams: {
      city: input.household.city,
      aqi: aqiValue ?? 0,
      memberCount: input.members.length,
    },
    limitations: Array.from(new Set(limitations)),
    recommendations,
    dailyPlan,
    supportingEvidence: evidence,
  };
}

export function runWhatIfScenario(
  baselineInput: EngineInput,
  modification: ScenarioModification
): ScenarioComparisonResult {
  const nowIso = baselineInput.nowIso ?? new Date().toISOString();
  const baselinePlan = generateProtectionPlan({ ...baselineInput, nowIso, isScenario: false });

  const baseSnap = baselineInput.primarySnapshot;
  let scenarioSnapshot: EnvironmentalSnapshot | null = baseSnap
    ? {
        ...baseSnap,
        id: `${baseSnap.id}-scenario`,
        dataType: 'hypothetical_scenario',
        providerLabel: `Hypothetical Scenario (${baseSnap.providerLabel} baseline)`,
        isDemoFixture: false,
        pollutants: { ...baseSnap.pollutants },
        warnings: [
          'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT.',
          ...baseSnap.warnings,
        ],
      }
    : {
        id: 'scenario-synthetic',
        provider: 'demo_fixture',
        providerLabel: 'Hypothetical Scenario Input',
        dataType: 'hypothetical_scenario',
        city: baselineInput.household.city,
        locationLabel: baselineInput.household.city,
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

  if (modification.simulateUnavailable) {
    scenarioSnapshot = {
      ...scenarioSnapshot,
      isAvailable: false,
      freshness: 'unavailable',
      measuredAt: null,
    };
  } else {
    if (typeof modification.pm25Override === 'number') {
      scenarioSnapshot.pollutants.pm25 = modification.pm25Override;
      scenarioSnapshot.reportedAqiIndia = null;
      scenarioSnapshot.isAvailable = true;
    }
    if (typeof modification.pm10Override === 'number') {
      scenarioSnapshot.pollutants.pm10 = modification.pm10Override;
      scenarioSnapshot.reportedAqiIndia = null;
      scenarioSnapshot.isAvailable = true;
    }
    if (typeof modification.aqiOverride === 'number') {
      scenarioSnapshot.reportedAqiIndia = modification.aqiOverride;
      scenarioSnapshot.isAvailable = true;
    }
    if (modification.simulateStale) {
      const tenHoursAgo = new Date(Date.parse(nowIso) - 10 * 60 * 60 * 1000).toISOString();
      scenarioSnapshot.measuredAt = tenHoursAgo;
      scenarioSnapshot.freshness = 'stale';
    } else if (scenarioSnapshot.isAvailable && !scenarioSnapshot.measuredAt) {
      scenarioSnapshot.measuredAt = nowIso;
      scenarioSnapshot.freshness = 'fresh';
    }
  }

  const modifiedRoutines = baselineInput.routines.map((r) => {
    if (modification.overrideRoutineId && r.id === modification.overrideRoutineId) {
      return {
        ...r,
        preferredWindow: modification.overrideWindow ?? r.preferredWindow,
        environment: modification.overrideEnvironment ?? r.environment,
      };
    }
    return r;
  });

  let modifiedForecasts = [...(baselineInput.forecastSlots ?? [])];
  if (modification.forecastTrendOverride && modification.forecastTrendOverride !== 'none') {
    if (modification.forecastTrendOverride === 'worsening') {
      modifiedForecasts = modifiedForecasts.map((f) => ({
        ...f,
        expectedPm25: f.expectedPm25 !== null ? Math.round(f.expectedPm25 * 1.45) : 140,
        expectedAqiIndia: f.expectedAqiIndia !== null ? Math.min(480, Math.round(f.expectedAqiIndia * 1.45)) : 260,
        trend: 'worsening',
      }));
    } else if (modification.forecastTrendOverride === 'improving') {
      modifiedForecasts = modifiedForecasts.map((f) => ({
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
  }

  const scenarioPlan = generateProtectionPlan({
    ...baselineInput,
    routines: modifiedRoutines,
    primarySnapshot: scenarioSnapshot,
    secondarySnapshots: [],
    forecastSlots: modifiedForecasts,
    nowIso,
    isScenario: true,
  });

  const baselineRecIds = new Set(baselinePlan.recommendations.map((r) => `${r.id}:${r.severity}:${r.titleKey}`));
  const scenarioRecIds = new Set(scenarioPlan.recommendations.map((r) => `${r.id}:${r.severity}:${r.titleKey}`));
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
    disclaimerBanner: 'SCENARIO — NOT AN OBSERVED ENVIRONMENTAL MEASUREMENT',
    modification,
    baselinePlan,
    scenarioPlan,
    changedRecommendationsCount,
    changedScheduleCount,
    changeSummaryKeys,
  };
}
