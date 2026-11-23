import type { EnvironmentalSnapshot, ForecastSlot } from '../../../shared/types';

export function buildUnavailableSnapshot(city: string, reason: string): EnvironmentalSnapshot {
  const now = new Date().toISOString();
  return {
    id: `unavailable-${city.toLowerCase().replace(/\s+/g, '-')}`,
    provider: 'unavailable',
    providerLabel: 'No Live Environmental Feed Active',
    dataType: 'physical_station',
    classification: 'unavailable',
    city,
    locationLabel: city,
    stationOrGridId: 'NONE',
    spatialResolutionNote: 'Provider unavailable or unconfigured',
    pollutants: {},
    reportedAqiIndia: null,
    measuredAt: null,
    retrievedAt: now,
    freshness: 'unavailable',
    licenseAttribution: 'N/A',
    warnings: [reason],
    isDemoFixture: false,
    isAvailable: false,
    coordinates: null,
    qualityMetadata: {
      validatedFields: [],
      missingPollutants: ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'],
      fromCache: false,
    },
  };
}

/**
 * Deterministic, clearly synthetic fallback for cities without a hand-authored fixture.
 * No coordinates or weather are invented. Values are illustrative only and must never
 * be presented as a live station measurement.
 */
export function buildDemoFixtureForCity(
  city: string,
  nowIso: string = new Date().toISOString()
): { snapshot: EnvironmentalSnapshot; forecasts: ForecastSlot[] } {
  const normalizedCity = city.trim().replace(/\s+/g, ' ');
  let seed = 0;
  for (const char of normalizedCity.toLowerCase()) {
    seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  }
  const pm25 = 24 + (seed % 57);
  const pm10 = Math.round(pm25 * (1.55 + (seed % 25) / 100));
  const no2 = 12 + (seed % 46);
  const o3 = 18 + (seed % 38);
  const aqi = Math.min(300, 45 + Math.round(pm25 * 1.45));
  const nowMs = Date.parse(nowIso);
  const issuedAt = new Date(nowMs - 30 * 60 * 1000).toISOString();
  const date = nowIso.slice(0, 10);

  const snapshot: EnvironmentalSnapshot = {
    id: `fixture-city-${seed.toString(36)}`,
    provider: 'demo_fixture',
    providerLabel: 'Illustrative Sample · Illustrative City Sample',
    dataType: 'city_bulletin',
    classification: 'demo_fixture',
    city: normalizedCity,
    locationLabel: `${normalizedCity} · Illustrative city-wide sample`,
    stationOrGridId: `SAMPLE-CITY-${seed.toString(36).toUpperCase()}`,
    spatialResolutionNote:
      'Synthetic city-level demonstration sample; not a physical station or measured location.',
    pollutants: { pm25, pm10, no2, o3, so2: 8 + (seed % 15), co: 0.4 + (seed % 8) / 10 },
    reportedAqiIndia: aqi,
    measuredAt: nowIso,
    retrievedAt: nowIso,
    freshness: 'fresh',
    licenseAttribution:
      'Synthetic demonstration data created by BreatheWise AI; not an external environmental observation.',
    warnings: [
      'SYNTHETIC SAMPLE — NOT LIVE MEASUREMENTS. Values are synthetic examples for interface and workflow illustration only.',
      'No physical station, sensor, or verified forecast is represented.',
    ],
    isDemoFixture: true,
    isAvailable: true,
    qualityMetadata: {
      validatedFields: ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'reportedAqiIndia'],
      missingPollutants: [],
      fromCache: false,
    },
  };

  const windows: Array<{
    timeWindow: ForecastSlot['timeWindow'];
    factor: number;
    trend: ForecastSlot['trend'];
  }> = [
    { timeWindow: '06:00-09:00', factor: 1.12, trend: 'worsening' },
    { timeWindow: '09:00-12:00', factor: 0.94, trend: 'improving' },
    { timeWindow: '12:00-16:00', factor: 0.82, trend: 'improving' },
    { timeWindow: '16:00-19:00', factor: 0.98, trend: 'stable' },
    { timeWindow: '19:00-22:00', factor: 1.16, trend: 'worsening' },
  ];

  const forecasts: ForecastSlot[] = windows.map((slot, index) => {
    const expectedPm25 = Math.round(pm25 * slot.factor);
    const expectedPm10 = Math.round(pm10 * slot.factor);
    return {
      id: `fixture-city-${seed.toString(36)}-forecast-${index}`,
      city: normalizedCity,
      timeWindow: slot.timeWindow,
      forecastDate: date,
      expectedPm25,
      expectedPm10,
      expectedAqiIndia: Math.min(300, Math.round(45 + expectedPm25 * 1.45)),
      trend: slot.trend,
      dataType: 'forecast',
      providerLabel: 'Demo Forecast Fixture · Synthetic Scenario',
      gridResolutionNote:
        'Illustrative synthetic trend for interface illustration; not a meteorological or CAMS forecast.',
      issuedAt,
      licenseAttribution:
        'Synthetic demonstration data created by BreatheWise AI; not an external forecast.',
      isDemoFixture: true,
    };
  });

  return { snapshot, forecasts };
}
