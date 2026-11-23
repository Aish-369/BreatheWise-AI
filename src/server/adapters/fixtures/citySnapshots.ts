import type { EnvironmentalSnapshot } from '../../../shared/types';

export function buildPuneShivajinagarSnapshot(nowIso: string): EnvironmentalSnapshot {
  const fortyMinsAgo = new Date(Date.parse(nowIso) - 40 * 60 * 1000).toISOString();
  return {
    id: 'fixture-pune-shivajinagar',
    provider: 'demo_fixture',
    providerLabel: 'Illustrative Sample · Pune Station Reference',
    dataType: 'physical_station',
    classification: 'demo_fixture',
    city: 'Pune',
    locationLabel: 'Shivajinagar Urban Corridor, Pune',
    stationOrGridId: 'SAMPLE-PNQ-SHIVAJINAGAR-01',
    spatialResolutionNote: 'Station-point illustrative sample (not a live CPCB/OpenAQ feed)',
    pollutants: { pm25: 68, pm10: 124, no2: 42, o3: 38, so2: 14, co: 0.9 },
    reportedAqiIndia: 127,
    measuredAt: fortyMinsAgo,
    retrievedAt: nowIso,
    freshness: 'fresh',
    licenseAttribution:
      'Synthetic illustrative sample modelled on CPCB NAQI reference bands (non-live)',
    warnings: [
      'SYNTHETIC SAMPLE: Clearly labelled synthetic reference data used because live API keys are unconfigured.',
    ],
    isDemoFixture: true,
    isAvailable: true,
    coordinates: { latitude: 18.5308, longitude: 73.8475 },
    qualityMetadata: {
      validatedFields: ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co', 'reportedAqiIndia'],
      missingPollutants: [],
      fromCache: false,
    },
  };
}

export function buildPunePashanSnapshot(nowIso: string): EnvironmentalSnapshot {
  const ninetyMinsAgo = new Date(Date.parse(nowIso) - 90 * 60 * 1000).toISOString();
  return {
    id: 'fixture-pune-pashan',
    provider: 'demo_fixture',
    providerLabel: 'Illustrative Sample · Pune West Sub-Station',
    dataType: 'city_bulletin',
    classification: 'demo_fixture',
    city: 'Pune',
    locationLabel: 'Pashan / Baner Perimeter, Pune',
    stationOrGridId: 'SAMPLE-PNQ-PASHAN-02',
    spatialResolutionNote: 'Neighborhood comparison fixture — greener canopy corridor',
    pollutants: { pm25: 52, pm10: 96, no2: 29, o3: 41, so2: null, co: null },
    reportedAqiIndia: 92,
    measuredAt: ninetyMinsAgo,
    retrievedAt: nowIso,
    freshness: 'fresh',
    licenseAttribution: 'Synthetic illustrative sample (non-live)',
    warnings: [
      'SYNTHETIC SAMPLE: Synthetic neighborhood comparison fixture; SO2 and CO not reported.',
    ],
    isDemoFixture: true,
    isAvailable: true,
    coordinates: { latitude: 18.5362, longitude: 73.7995 },
    qualityMetadata: {
      validatedFields: ['pm25', 'pm10', 'no2', 'o3', 'reportedAqiIndia'],
      missingPollutants: ['so2', 'co'],
      fromCache: false,
    },
  };
}

export function buildAhilyanagarSnapshot(nowIso: string): EnvironmentalSnapshot {
  const fourHoursAgo = new Date(Date.parse(nowIso) - 4.5 * 60 * 60 * 1000).toISOString();
  return {
    id: 'fixture-ahilyanagar-midc',
    provider: 'demo_fixture',
    providerLabel: 'Illustrative Sample · Ahilyanagar Regional Bulletin',
    dataType: 'city_bulletin',
    classification: 'demo_fixture',
    city: 'Ahilyanagar',
    locationLabel: 'Ahilyanagar Municipal Center',
    stationOrGridId: 'SAMPLE-AHN-BULLETIN-01',
    spatialResolutionNote: 'Single regional bulletin fixture; sparse street-level coverage',
    pollutants: { pm25: 54, pm10: 112, no2: null, o3: null, so2: null, co: null },
    reportedAqiIndia: null,
    measuredAt: fourHoursAgo,
    retrievedAt: nowIso,
    freshness: 'aging',
    licenseAttribution:
      'Synthetic illustrative sample showing partial regional coverage (non-live)',
    warnings: [
      'SYNTHETIC SAMPLE: Demonstrates partial coverage in Ahilyanagar — NO2, O3, SO2, and CO are missing.',
      'Reading is 4.5 hours old (aging) with no multi-station cross-check available.',
    ],
    isDemoFixture: true,
    isAvailable: true,
    coordinates: { latitude: 19.0948, longitude: 74.748 },
    qualityMetadata: {
      validatedFields: ['pm25', 'pm10'],
      missingPollutants: ['no2', 'o3', 'so2', 'co'],
      fromCache: false,
    },
  };
}
