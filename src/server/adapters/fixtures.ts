import type { EnvironmentalSnapshot, ForecastSlot } from '../../shared/types';

export function buildDemoFixtures(nowIso: string = new Date().toISOString()): {
  snapshots: EnvironmentalSnapshot[];
  forecasts: ForecastSlot[];
} {
  const nowMs = Date.parse(nowIso);
  const fortyMinsAgo = new Date(nowMs - 40 * 60 * 1000).toISOString();
  const ninetyMinsAgo = new Date(nowMs - 90 * 60 * 1000).toISOString();
  const fourHoursAgo = new Date(nowMs - 4.5 * 60 * 60 * 1000).toISOString();
  const todayDate = nowIso.slice(0, 10);

  const snapshots: EnvironmentalSnapshot[] = [
    {
      id: 'fixture-pune-shivajinagar',
      provider: 'demo_fixture',
      providerLabel: 'Demo Fixture · Pune Station Reference',
      dataType: 'physical_station',
      city: 'Pune',
      locationLabel: 'Shivajinagar Urban Corridor, Pune',
      stationOrGridId: 'DEMO-PNQ-SHIVAJINAGAR-01',
      spatialResolutionNote: 'Station-point demonstration fixture (not a live CPCB/OpenAQ feed)',
      pollutants: {
        pm25: 68,
        pm10: 124,
        no2: 42,
        o3: 38,
        so2: 14,
        co: 0.9,
      },
      reportedAqiIndia: 127,
      measuredAt: fortyMinsAgo,
      retrievedAt: nowIso,
      freshness: 'fresh',
      licenseAttribution: 'Synthetic demonstration fixture modelled on CPCB NAQI reference bands (non-live)',
      warnings: [
        'DEMO FIXTURE: Clearly labelled synthetic reference data used because live API keys are unconfigured.',
      ],
      isDemoFixture: true,
      isAvailable: true,
    },
    {
      id: 'fixture-pune-pashan',
      provider: 'demo_fixture',
      providerLabel: 'Demo Fixture · Pune West Sub-Station',
      dataType: 'city_bulletin',
      city: 'Pune',
      locationLabel: 'Pashan / Baner Perimeter, Pune',
      stationOrGridId: 'DEMO-PNQ-PASHAN-02',
      spatialResolutionNote: 'Neighborhood comparison fixture — greener canopy corridor',
      pollutants: {
        pm25: 52,
        pm10: 96,
        no2: 29,
        o3: 41,
        so2: null,
        co: null,
      },
      reportedAqiIndia: 92,
      measuredAt: ninetyMinsAgo,
      retrievedAt: nowIso,
      freshness: 'fresh',
      licenseAttribution: 'Synthetic demonstration fixture (non-live)',
      warnings: [
        'DEMO FIXTURE: Synthetic neighborhood comparison fixture; SO2 and CO not reported.',
      ],
      isDemoFixture: true,
      isAvailable: true,
    },
    {
      id: 'fixture-ahilyanagar-midc',
      provider: 'demo_fixture',
      providerLabel: 'Demo Fixture · Ahilyanagar Regional Bulletin',
      dataType: 'city_bulletin',
      city: 'Ahilyanagar',
      locationLabel: 'Ahilyanagar Municipal Center',
      stationOrGridId: 'DEMO-AHN-BULLETIN-01',
      spatialResolutionNote: 'Single regional bulletin fixture; sparse street-level coverage',
      pollutants: {
        pm25: 54,
        pm10: 112,
        no2: null,
        o3: null,
        so2: null,
        co: null,
      },
      reportedAqiIndia: null,
      measuredAt: fourHoursAgo,
      retrievedAt: nowIso,
      freshness: 'aging',
      licenseAttribution: 'Synthetic demonstration fixture showing partial regional coverage (non-live)',
      warnings: [
        'DEMO FIXTURE: Demonstrates partial coverage in Ahilyanagar — NO2, O3, SO2, and CO are missing.',
        'Reading is 4.5 hours old (aging) with no multi-station cross-check available.',
      ],
      isDemoFixture: true,
      isAvailable: true,
    },
  ];

  // Coarse CAMS-style demonstration forecast for Pune only (Ahilyanagar intentionally omits forecast to demonstrate limitation handling)
  const forecasts: ForecastSlot[] = [
    {
      id: 'fixture-cams-pune-06',
      city: 'Pune',
      timeWindow: '06:00-09:00',
      forecastDate: todayDate,
      expectedPm25: 76,
      expectedPm10: 138,
      expectedAqiIndia: 153,
      trend: 'worsening',
      dataType: 'forecast',
      providerLabel: 'Demo CAMS Coarse-Grid Fixture',
      gridResolutionNote: 'Coarse ~40 km regional model grid; does not capture street-level traffic plumes.',
      issuedAt: ninetyMinsAgo,
      licenseAttribution: 'Demo fixture formatted for Copernicus Atmosphere Monitoring Service (CAMS) schema',
      isDemoFixture: true,
    },
    {
      id: 'fixture-cams-pune-09',
      city: 'Pune',
      timeWindow: '09:00-12:00',
      forecastDate: todayDate,
      expectedPm25: 62,
      expectedPm10: 118,
      expectedAqiIndia: 107,
      trend: 'improving',
      dataType: 'forecast',
      providerLabel: 'Demo CAMS Coarse-Grid Fixture',
      gridResolutionNote: 'Coarse ~40 km regional model grid; does not capture street-level traffic plumes.',
      issuedAt: ninetyMinsAgo,
      licenseAttribution: 'Demo fixture formatted for Copernicus Atmosphere Monitoring Service (CAMS) schema',
      isDemoFixture: true,
    },
    {
      id: 'fixture-cams-pune-12',
      city: 'Pune',
      timeWindow: '12:00-16:00',
      forecastDate: todayDate,
      expectedPm25: 44,
      expectedPm10: 88,
      expectedAqiIndia: 73,
      trend: 'improving',
      dataType: 'forecast',
      providerLabel: 'Demo CAMS Coarse-Grid Fixture',
      gridResolutionNote: 'Coarse ~40 km regional model grid; does not capture street-level traffic plumes.',
      issuedAt: ninetyMinsAgo,
      licenseAttribution: 'Demo fixture formatted for Copernicus Atmosphere Monitoring Service (CAMS) schema',
      isDemoFixture: true,
    },
    {
      id: 'fixture-cams-pune-16',
      city: 'Pune',
      timeWindow: '16:00-19:00',
      forecastDate: todayDate,
      expectedPm25: 59,
      expectedPm10: 110,
      expectedAqiIndia: 98,
      trend: 'stable',
      dataType: 'forecast',
      providerLabel: 'Demo CAMS Coarse-Grid Fixture',
      gridResolutionNote: 'Coarse ~40 km regional model grid; does not capture street-level traffic plumes.',
      issuedAt: ninetyMinsAgo,
      licenseAttribution: 'Demo fixture formatted for Copernicus Atmosphere Monitoring Service (CAMS) schema',
      isDemoFixture: true,
    },
    {
      id: 'fixture-cams-pune-19',
      city: 'Pune',
      timeWindow: '19:00-22:00',
      forecastDate: todayDate,
      expectedPm25: 72,
      expectedPm10: 132,
      expectedAqiIndia: 140,
      trend: 'worsening',
      dataType: 'forecast',
      providerLabel: 'Demo CAMS Coarse-Grid Fixture',
      gridResolutionNote: 'Coarse ~40 km regional model grid; does not capture street-level traffic plumes.',
      issuedAt: ninetyMinsAgo,
      licenseAttribution: 'Demo fixture formatted for Copernicus Atmosphere Monitoring Service (CAMS) schema',
      isDemoFixture: true,
    },
  ];

  return { snapshots, forecasts };
}

export function buildUnavailableSnapshot(city: string, reason: string): EnvironmentalSnapshot {
  const now = new Date().toISOString();
  return {
    id: `unavailable-${city.toLowerCase().replace(/\s+/g, '-')}`,
    provider: 'unavailable',
    providerLabel: 'No Live Environmental Feed Active',
    dataType: 'physical_station',
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
  };
}
