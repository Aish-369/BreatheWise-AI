import type {
  DataClassification,
  EnvironmentalSnapshot,
  ForecastSlot,
  SupportingEvidence,
} from '../../shared/types';
import {
  analyzeHistoricalTrend,
  detectProviderConflict,
  validateEnvironmentalSnapshot,
} from '../quality';
import { determineConfidenceLevel } from './riskScoring';
import type { EngineInput, EvidenceBundle } from './types';

export function buildSupportingEvidence(
  snapshot: EnvironmentalSnapshot | null,
  aqiValue: number | null,
  aqiIsDerived: boolean,
  freshness: SupportingEvidence['freshness'],
  classification: DataClassification
): SupportingEvidence {
  return {
    providerLabel: snapshot?.providerLabel ?? 'No active provider',
    stationOrGridId: snapshot?.stationOrGridId ?? 'Unavailable',
    dataType: snapshot?.dataType ?? 'physical_station',
    classification,
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

export function collectPlanLimitations(
  validationWarnings: string[],
  conflictDetails: string | null,
  hasConflict: boolean,
  forecasts: ForecastSlot[]
): string[] {
  const limitations: string[] = [...validationWarnings];
  if (hasConflict && conflictDetails) {
    limitations.push(conflictDetails);
  }
  if (forecasts.length === 0) {
    limitations.push(
      'No verified forecast series is loaded for this city; alternative time windows cannot be projected.'
    );
  } else {
    limitations.push(
      'Forecast guidance uses coarse grid estimates and cannot establish street-level air safety.'
    );
  }
  return Array.from(new Set(limitations));
}

export function collectPlanEvidence(input: EngineInput, nowIso: string): EvidenceBundle {
  const todayDate = nowIso.slice(0, 10);
  const secondary = input.secondarySnapshots ?? [];
  const forecasts = (input.forecastSlots ?? []).filter(
    (f) => f.city.toLowerCase() === input.household.city.toLowerCase()
  );

  const validation = validateEnvironmentalSnapshot(input.primarySnapshot, nowIso);
  const conflict = detectProviderConflict(input.primarySnapshot, secondary, nowIso);
  const historicalTrend = analyzeHistoricalTrend(
    input.historicalSnapshots ?? [],
    input.household.city,
    input.primarySnapshot
  );

  const aqiValue = validation.derivedAqi.aqi;
  const aqiBand = validation.derivedAqi.band;
  const dominantPollutant = validation.derivedAqi.dominantPollutant;
  const freshness = validation.freshness;
  const classification: DataClassification = input.isScenario
    ? 'unavailable'
    : validation.classification;
  const isAvailable = Boolean(input.primarySnapshot?.isAvailable) && validation.valid;

  const evidence = buildSupportingEvidence(
    input.primarySnapshot,
    aqiValue,
    validation.derivedAqi.isDerived,
    freshness,
    classification
  );
  const limitations = collectPlanLimitations(
    validation.warnings,
    conflict.details,
    conflict.hasConflict,
    forecasts
  );
  const confidence = determineConfidenceLevel({
    isScenario: Boolean(input.isScenario),
    isAvailable,
    hasConflict: conflict.hasConflict,
    freshness,
    missingPrimaryParticulates: validation.missingPrimaryParticulates,
    pm25: input.primarySnapshot?.pollutants.pm25,
  });

  return {
    nowIso,
    todayDate,
    forecasts,
    validation,
    conflict,
    historicalTrend,
    aqiValue,
    aqiBand,
    dominantPollutant,
    freshness,
    classification,
    isAvailable,
    evidence,
    limitations,
    confidence,
  };
}
