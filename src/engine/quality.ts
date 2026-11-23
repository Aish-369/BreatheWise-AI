import type {
  AqiBand,
  DataClassification,
  EnvironmentalSnapshot,
  FreshnessStatus,
  HistoricalTrendSummary,
  Pollutants,
} from '../shared/types';

export interface DerivedAqiResult {
  aqi: number | null;
  band: AqiBand;
  dominantPollutant: string | null;
  isDerived: boolean;
}

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// Official India National Air Quality Index (CPCB NAQI) 24h/8h breakpoints
const PM25_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 },
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },
  { cLow: 251, cHigh: 1000, iLow: 401, iHigh: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
  { cLow: 431, cHigh: 1500, iLow: 401, iHigh: 500 },
];

const NO2_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
  { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
  { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
  { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
  { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
  { cLow: 401, cHigh: 1500, iLow: 401, iHigh: 500 },
];

const O3_BREAKPOINTS: Breakpoint[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
  { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
  { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
  { cLow: 749, cHigh: 1500, iLow: 401, iHigh: 500 },
];

function computeSubIndex(value: number, breakpoints: Breakpoint[]): number {
  const rounded = Math.round(value);
  for (const bp of breakpoints) {
    if (rounded >= bp.cLow && rounded <= bp.cHigh) {
      const spanC = bp.cHigh - bp.cLow;
      const spanI = bp.iHigh - bp.iLow;
      if (spanC <= 0) return bp.iLow;
      return Math.round(((rounded - bp.cLow) / spanC) * spanI + bp.iLow);
    }
  }
  return 500;
}

export function aqiToBand(aqi: number | null | undefined): AqiBand {
  if (aqi === null || aqi === undefined || Number.isNaN(aqi) || aqi < 0) {
    return 'unavailable';
  }
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very_poor';
  return 'severe';
}

export function classifyFreshness(
  measuredAtIso: string | null | undefined,
  nowIso: string = new Date().toISOString()
): FreshnessStatus {
  if (!measuredAtIso) return 'unavailable';
  const measuredMs = Date.parse(measuredAtIso);
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(measuredMs) || Number.isNaN(nowMs)) return 'unavailable';

  // Reject timestamps more than 20 minutes in the future as invalid clock/sensor telemetry
  if (measuredMs - nowMs > 20 * 60 * 1000) return 'unavailable';

  const ageHours = Math.max(0, (nowMs - measuredMs) / (1000 * 60 * 60));
  if (ageHours <= 2) return 'fresh';
  if (ageHours <= 6) return 'aging';
  return 'stale';
}

export function classifySnapshotTier(
  snapshot: EnvironmentalSnapshot | null | undefined,
  freshness: FreshnessStatus
): DataClassification {
  if (!snapshot || !snapshot.isAvailable || snapshot.provider === 'unavailable') {
    return 'unavailable';
  }
  if (snapshot.isDemoFixture || snapshot.provider === 'demo_fixture') {
    return 'demo_fixture';
  }
  if (snapshot.dataType === 'forecast') {
    return 'forecast_only';
  }
  if (freshness === 'unavailable') {
    return 'unavailable';
  }
  if (freshness === 'stale') {
    return 'historical_observation';
  }
  return 'verified_live';
}

export function deriveAqiFromPollutants(
  pollutants: Pollutants,
  reportedAqi?: number | null
): DerivedAqiResult {
  const subIndices: Array<{ pollutant: string; subIndex: number }> = [];

  if (typeof pollutants.pm25 === 'number' && pollutants.pm25 >= 0 && pollutants.pm25 <= 2000) {
    subIndices.push({
      pollutant: 'PM2.5',
      subIndex: computeSubIndex(pollutants.pm25, PM25_BREAKPOINTS),
    });
  }
  if (typeof pollutants.pm10 === 'number' && pollutants.pm10 >= 0 && pollutants.pm10 <= 3000) {
    subIndices.push({
      pollutant: 'PM10',
      subIndex: computeSubIndex(pollutants.pm10, PM10_BREAKPOINTS),
    });
  }
  if (typeof pollutants.no2 === 'number' && pollutants.no2 >= 0 && pollutants.no2 <= 2000) {
    subIndices.push({
      pollutant: 'NO2',
      subIndex: computeSubIndex(pollutants.no2, NO2_BREAKPOINTS),
    });
  }
  if (typeof pollutants.o3 === 'number' && pollutants.o3 >= 0 && pollutants.o3 <= 1500) {
    subIndices.push({ pollutant: 'O3', subIndex: computeSubIndex(pollutants.o3, O3_BREAKPOINTS) });
  }

  subIndices.sort((a, b) => b.subIndex - a.subIndex);
  const dominant = subIndices[0] ?? null;

  if (typeof reportedAqi === 'number' && reportedAqi >= 0 && reportedAqi <= 1000) {
    return {
      aqi: Math.round(reportedAqi),
      band: aqiToBand(reportedAqi),
      dominantPollutant: dominant?.pollutant ?? null,
      isDerived: false,
    };
  }

  if (!dominant) {
    return {
      aqi: null,
      band: 'unavailable',
      dominantPollutant: null,
      isDerived: false,
    };
  }

  return {
    aqi: dominant.subIndex,
    band: aqiToBand(dominant.subIndex),
    dominantPollutant: dominant.pollutant,
    isDerived: true,
  };
}

export interface SnapshotValidationResult {
  valid: boolean;
  freshness: FreshnessStatus;
  classification: DataClassification;
  derivedAqi: DerivedAqiResult;
  missingPrimaryParticulates: boolean;
  warnings: string[];
}

export function validateEnvironmentalSnapshot(
  snapshot: EnvironmentalSnapshot | null | undefined,
  nowIso: string = new Date().toISOString()
): SnapshotValidationResult {
  if (!snapshot || !snapshot.isAvailable) {
    return {
      valid: false,
      freshness: 'unavailable',
      classification: 'unavailable',
      derivedAqi: { aqi: null, band: 'unavailable', dominantPollutant: null, isDerived: false },
      missingPrimaryParticulates: true,
      warnings: ['No verified environmental measurement is currently available for this location.'],
    };
  }

  const warnings = [...snapshot.warnings];
  const freshness =
    snapshot.dataType === 'forecast' || snapshot.dataType === 'hypothetical_scenario'
      ? snapshot.freshness
      : classifyFreshness(snapshot.measuredAt, nowIso);

  const classification = classifySnapshotTier(snapshot, freshness);

  if (freshness === 'unavailable') {
    warnings.push(
      'Measurement timestamp is missing or invalid; reading cannot be treated as current.'
    );
  } else if (freshness === 'stale') {
    warnings.push(
      'Measurement is older than 6 hours and may no longer reflect current air conditions.'
    );
  } else if (freshness === 'aging') {
    warnings.push('Measurement is 2 to 6 hours old; local conditions may have shifted.');
  }

  const p = snapshot.pollutants;
  const hasPm25 = typeof p.pm25 === 'number' && Number.isFinite(p.pm25) && p.pm25 >= 0;
  const hasPm10 = typeof p.pm10 === 'number' && Number.isFinite(p.pm10) && p.pm10 >= 0;
  const missingPrimaryParticulates = !hasPm25 && !hasPm10;

  if (missingPrimaryParticulates) {
    warnings.push('Both PM2.5 and PM10 readings are missing from this report.');
  } else if (!hasPm25) {
    warnings.push(
      'PM2.5 reading is unavailable; fine particulate guidance relies on available coarse particulate data.'
    );
  }

  const derivedAqi = deriveAqiFromPollutants(p, snapshot.reportedAqiIndia);
  if (derivedAqi.isDerived && derivedAqi.aqi !== null) {
    warnings.push(
      'AQI value shown is derived from reported pollutant sub-indices (India NAQI reference), not an official station bulletin index.'
    );
  }

  return {
    valid: freshness !== 'unavailable' && (derivedAqi.aqi !== null || !missingPrimaryParticulates),
    freshness,
    classification,
    derivedAqi,
    missingPrimaryParticulates,
    warnings: Array.from(new Set(warnings)),
  };
}

export interface ProviderConflictReport {
  hasConflict: boolean;
  conflictWarningKey: string | null;
  details: string | null;
}

export function detectProviderConflict(
  primary: EnvironmentalSnapshot | null,
  secondaries: EnvironmentalSnapshot[],
  nowIso: string = new Date().toISOString()
): ProviderConflictReport {
  if (!primary || !primary.isAvailable) {
    return { hasConflict: false, conflictWarningKey: null, details: null };
  }

  const primaryVal = validateEnvironmentalSnapshot(primary, nowIso);
  if (!primaryVal.valid || primaryVal.derivedAqi.aqi === null) {
    return { hasConflict: false, conflictWarningKey: null, details: null };
  }

  for (const sec of secondaries) {
    if (!sec.isAvailable || sec.city.toLowerCase() !== primary.city.toLowerCase()) continue;
    if (sec.id === primary.id) continue;
    const secVal = validateEnvironmentalSnapshot(sec, nowIso);
    if (!secVal.valid || secVal.derivedAqi.aqi === null) continue;

    const aqiDiff = Math.abs(primaryVal.derivedAqi.aqi - secVal.derivedAqi.aqi);
    const pPm25 = primary.pollutants.pm25;
    const sPm25 = sec.pollutants.pm25;
    const pmDiffRatio =
      typeof pPm25 === 'number' && typeof sPm25 === 'number' && Math.max(pPm25, sPm25) > 0
        ? Math.abs(pPm25 - sPm25) / Math.max(pPm25, sPm25)
        : 0;

    if (aqiDiff >= 35 || pmDiffRatio >= 0.35) {
      return {
        hasConflict: true,
        conflictWarningKey: 'conflict_provider_divergence',
        details: `${primary.providerLabel} (${primaryVal.derivedAqi.aqi} AQI) differs substantially from ${sec.providerLabel} (${secVal.derivedAqi.aqi} AQI).`,
      };
    }
  }

  return { hasConflict: false, conflictWarningKey: null, details: null };
}

export function analyzeHistoricalTrend(
  snapshots: EnvironmentalSnapshot[],
  city: string,
  currentSnapshot: EnvironmentalSnapshot | null
): HistoricalTrendSummary | null {
  const candidates = [...snapshots];
  if (currentSnapshot && currentSnapshot.isAvailable) {
    candidates.push(currentSnapshot);
  }

  const valid = candidates
    .filter(
      (s) =>
        s.isAvailable &&
        !s.isDemoFixture &&
        s.city.toLowerCase() === city.toLowerCase() &&
        typeof s.pollutants.pm25 === 'number' &&
        Boolean(s.measuredAt)
    )
    .sort((a, b) => Date.parse(a.measuredAt!) - Date.parse(b.measuredAt!));

  // Deduplicate by timestamp so repeated refreshes of the same reading do not look like a trend
  const distinctByTime: EnvironmentalSnapshot[] = [];
  for (const s of valid) {
    const prev = distinctByTime[distinctByTime.length - 1];
    if (!prev || prev.measuredAt !== s.measuredAt) {
      distinctByTime.push(s);
    }
  }

  if (distinctByTime.length < 2) {
    return null;
  }

  const previous = distinctByTime[distinctByTime.length - 2];
  const latest = distinctByTime[distinctByTime.length - 1];
  const prevPm = previous.pollutants.pm25 ?? null;
  const latestPm = latest.pollutants.pm25 ?? null;
  if (prevPm === null || latestPm === null) return null;

  const delta = Math.round((latestPm - prevPm) * 10) / 10;
  let direction: HistoricalTrendSummary['direction'] = 'stable';
  if (delta >= 10) direction = 'worsening';
  else if (delta <= -10) direction = 'improving';

  return {
    direction,
    previousPm25: prevPm,
    latestPm25: latestPm,
    deltaPm25: delta,
    sampleCount: distinctByTime.length,
  };
}

export interface ComparisonCompatibilityReport {
  compatible: boolean;
  warningKeys: string[];
}

export function assessLocationComparisonCompatibility(
  snapA: EnvironmentalSnapshot | null | undefined,
  snapB: EnvironmentalSnapshot | null | undefined,
  nowIso: string = new Date().toISOString()
): ComparisonCompatibilityReport {
  const warningKeys: string[] = [];
  if (!snapA || !snapA.isAvailable || !snapB || !snapB.isAvailable) {
    warningKeys.push('comp_warn_missing_coverage');
    return { compatible: false, warningKeys };
  }

  const valA = validateEnvironmentalSnapshot(snapA, nowIso);
  const valB = validateEnvironmentalSnapshot(snapB, nowIso);

  if (valA.classification !== valB.classification) {
    warningKeys.push('comp_warn_mixed_tiers');
  }

  if (snapA.measuredAt && snapB.measuredAt) {
    const diffHours =
      Math.abs(Date.parse(snapA.measuredAt) - Date.parse(snapB.measuredAt)) / (1000 * 60 * 60);
    if (Number.isFinite(diffHours) && diffHours >= 3) {
      warningKeys.push('comp_warn_timestamp_skew');
    }
  }

  const missingGasA = snapA.pollutants.no2 == null || snapA.pollutants.o3 == null;
  const missingGasB = snapB.pollutants.no2 == null || snapB.pollutants.o3 == null;
  if (missingGasA !== missingGasB) {
    warningKeys.push('comp_warn_partial_pollutants');
  }

  return {
    compatible: warningKeys.length === 0,
    warningKeys,
  };
}
