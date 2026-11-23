import type { ForecastSlot } from '../../../shared/types';

const PUNE_FORECAST_SPECS: Array<{
  idSuffix: string;
  timeWindow: ForecastSlot['timeWindow'];
  expectedPm25: number;
  expectedPm10: number;
  expectedAqiIndia: number;
  trend: ForecastSlot['trend'];
}> = [
  {
    idSuffix: '06',
    timeWindow: '06:00-09:00',
    expectedPm25: 76,
    expectedPm10: 138,
    expectedAqiIndia: 153,
    trend: 'worsening',
  },
  {
    idSuffix: '09',
    timeWindow: '09:00-12:00',
    expectedPm25: 62,
    expectedPm10: 118,
    expectedAqiIndia: 107,
    trend: 'improving',
  },
  {
    idSuffix: '12',
    timeWindow: '12:00-16:00',
    expectedPm25: 44,
    expectedPm10: 88,
    expectedAqiIndia: 73,
    trend: 'improving',
  },
  {
    idSuffix: '16',
    timeWindow: '16:00-19:00',
    expectedPm25: 59,
    expectedPm10: 110,
    expectedAqiIndia: 98,
    trend: 'stable',
  },
  {
    idSuffix: '19',
    timeWindow: '19:00-22:00',
    expectedPm25: 72,
    expectedPm10: 132,
    expectedAqiIndia: 140,
    trend: 'worsening',
  },
];

// Coarse CAMS-style illustrative forecast for Pune only (Ahilyanagar intentionally omits forecast to demonstrate limitation handling)
export function buildPuneForecasts(nowIso: string): ForecastSlot[] {
  const issuedAt = new Date(Date.parse(nowIso) - 90 * 60 * 1000).toISOString();
  const todayDate = nowIso.slice(0, 10);

  return PUNE_FORECAST_SPECS.map((spec) => ({
    id: `fixture-cams-pune-${spec.idSuffix}`,
    city: 'Pune',
    timeWindow: spec.timeWindow,
    forecastDate: todayDate,
    expectedPm25: spec.expectedPm25,
    expectedPm10: spec.expectedPm10,
    expectedAqiIndia: spec.expectedAqiIndia,
    trend: spec.trend,
    dataType: 'forecast',
    providerLabel: 'Illustrative CAMS Grid Sample',
    gridResolutionNote:
      'Coarse ~40 km regional model grid; does not capture street-level traffic plumes.',
    issuedAt,
    licenseAttribution:
      'Synthetic sample formatted for Copernicus Atmosphere Monitoring Service (CAMS) schema',
    isDemoFixture: true,
  }));
}
