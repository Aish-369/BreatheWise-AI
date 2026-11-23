import { z } from 'zod';
import { classifyFreshness, classifySnapshotTier } from '../../engine/quality';
import { findCityMetadata } from '../../shared/indianCities';
import type {
  EnvironmentalSnapshot,
  ProviderAdapterStatus,
  WeatherFields,
} from '../../shared/types';
import { listMissingPollutants } from './httpClient';

const OpenAqSensorSchema = z.object({
  id: z.number(),
  parameter: z.object({ name: z.string().optional(), units: z.string().optional() }).optional(),
  latest: z
    .object({
      value: z.number().optional(),
      datetime: z.object({ utc: z.string().optional() }).optional(),
    })
    .optional(),
});

const OpenAqLocationSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  locality: z.string().nullable().optional(),
  coordinates: z
    .object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) })
    .optional(),
  datetimeLast: z.object({ utc: z.string().optional() }).optional(),
  sensors: z.array(OpenAqSensorSchema).optional(),
});

const OpenAqPayloadSchema = z.object({ results: z.array(OpenAqLocationSchema).optional() });
const OpenAqLatestReadingSchema = z.object({
  value: z.number(),
  datetime: z.object({ utc: z.string() }),
  sensorsId: z.number(),
});
export const OpenAqLatestPayloadSchema = z.object({
  results: z.array(OpenAqLatestReadingSchema).optional(),
});

export type OpenAqLocation = z.infer<typeof OpenAqLocationSchema>;
export type OpenAqLatestReading = z.infer<typeof OpenAqLatestReadingSchema>;

const POLLUTANT_BOUNDS: Record<string, number> = {
  pm25: 2000,
  pm10: 3000,
  no2: 2000,
  o3: 1500,
  so2: 2000,
  co: 100,
};

export function buildOpenAqHeaders(apiKey: string): Record<string, string> {
  return { 'X-API-Key': apiKey };
}

export function buildOpenAqLocationsUrl(canonicalCity: string): {
  url: string;
  hasCoords: boolean;
} {
  const cityMeta = findCityMetadata(canonicalCity);
  if (cityMeta) {
    return {
      url: `https://api.openaq.org/v3/locations?coordinates=${cityMeta.latitude},${cityMeta.longitude}&radius=25000&limit=5`,
      hasCoords: true,
    };
  }
  return { url: 'https://api.openaq.org/v3/locations?iso=IN&limit=30', hasCoords: false };
}

export function parseOpenAqLocations(
  rawJson: unknown,
  canonicalCity: string,
  hasCoords: boolean
): OpenAqLocation[] | null {
  const parsed = OpenAqPayloadSchema.safeParse(rawJson);
  if (!parsed.success) return null;
  let results = parsed.data.results ?? [];
  if (!hasCoords) {
    const targetLower = canonicalCity.toLowerCase();
    results = results.filter(
      (loc) =>
        (loc.locality && loc.locality.toLowerCase().includes(targetLower)) ||
        (loc.name && loc.name.toLowerCase().includes(targetLower))
    );
  }
  return results;
}

function applyOpenAqReading(
  param: string,
  val: number,
  pollutants: EnvironmentalSnapshot['pollutants'],
  weather: WeatherFields,
  validatedFields: string[],
  rejectedFields: string[]
): void {
  if (param in POLLUTANT_BOUNDS) {
    if (val < 0 || val > POLLUTANT_BOUNDS[param]) {
      rejectedFields.push(`${param}=${val}`);
      return;
    }
    if (param === 'pm25') pollutants.pm25 = Math.round(val * 10) / 10;
    else if (param === 'pm10') pollutants.pm10 = Math.round(val * 10) / 10;
    else if (param === 'no2') pollutants.no2 = Math.round(val * 10) / 10;
    else if (param === 'o3') pollutants.o3 = Math.round(val * 10) / 10;
    else if (param === 'so2') pollutants.so2 = Math.round(val * 10) / 10;
    else if (param === 'co') pollutants.co = Math.round(val * 100) / 100;
    validatedFields.push(param);
  } else if (param === 'temperature' && val >= -40 && val <= 65) {
    weather.temperatureC = Math.round(val * 10) / 10;
    validatedFields.push('temperatureC');
  } else if ((param === 'relativehumidity' || param === 'humidity') && val >= 0 && val <= 100) {
    weather.relativeHumidityPct = Math.round(val * 10) / 10;
    validatedFields.push('relativeHumidityPct');
  } else if (param === 'wind_speed' && val >= 0 && val <= 120) {
    weather.windSpeedMs = Math.round(val * 10) / 10;
    validatedFields.push('windSpeedMs');
  }
}

export function mapOpenAqLocationToSnapshot(
  loc: OpenAqLocation,
  readings: OpenAqLatestReading[],
  canonicalCity: string,
  checkedAt: string
): EnvironmentalSnapshot | null {
  const pollutants: EnvironmentalSnapshot['pollutants'] = {};
  const weather: WeatherFields = {};
  const validatedFields: string[] = [];
  const rejectedFields: string[] = [];
  const parameterBySensorId = new Map<number, string>(
    (loc.sensors ?? []).map((sensor) => [sensor.id, sensor.parameter?.name?.toLowerCase() ?? ''])
  );
  let latestIso: string | null = null;

  for (const reading of readings) {
    const param = parameterBySensorId.get(reading.sensorsId);
    if (!param || !Number.isFinite(reading.value)) continue;
    applyOpenAqReading(param, reading.value, pollutants, weather, validatedFields, rejectedFields);
    if (!latestIso || reading.datetime.utc > latestIso) latestIso = reading.datetime.utc;
  }

  const freshness = classifyFreshness(latestIso, checkedAt);
  const isAvailable = Object.keys(pollutants).length > 0 && freshness !== 'unavailable';
  if (!isAvailable) return null;

  const warnings =
    rejectedFields.length > 0
      ? [
          `Excluded out-of-range sensor reading(s) from upstream report: ${rejectedFields.join(', ')}.`,
        ]
      : [];

  const snap: EnvironmentalSnapshot = {
    id: `openaq-${loc.id}`,
    provider: 'openaq',
    providerLabel: 'OpenAQ API v3',
    dataType: 'physical_station',
    city: canonicalCity,
    locationLabel: loc.name || loc.locality || canonicalCity,
    stationOrGridId: `OPENAQ-LOC-${loc.id}`,
    spatialResolutionNote: 'Physical monitoring station reported via OpenAQ v3',
    pollutants,
    reportedAqiIndia: null,
    measuredAt: latestIso,
    retrievedAt: checkedAt,
    freshness,
    licenseAttribution: 'Source aggregated by OpenAQ API v3 (per-source open license)',
    warnings,
    isDemoFixture: false,
    isAvailable: true,
    coordinates: loc.coordinates ?? null,
    weather: Object.keys(weather).length > 0 ? weather : undefined,
    qualityMetadata: {
      validatedFields,
      missingPollutants: listMissingPollutants(pollutants),
      rejectedFields: rejectedFields.length > 0 ? rejectedFields : undefined,
      fromCache: false,
    },
  };
  snap.classification = classifySnapshotTier(snap, freshness);
  return snap;
}

export function buildBaseOpenAqStatus(
  apiKey: string | undefined,
  checkedAt: string
): ProviderAdapterStatus {
  return {
    provider: 'openaq',
    name: 'OpenAQ API v3',
    configured: Boolean(apiKey),
    liveReachable: false,
    status: apiKey ? 'unavailable' : 'unconfigured',
    licenseName: 'OpenAQ Aggregated Open Data (per-station licenses via /v3/licenses)',
    attributionText: 'Data aggregated via OpenAQ (https://openaq.org)',
    notes: apiKey
      ? 'API key configured on server.'
      : 'Requires free OpenAQ v3 X-API-Key in server environment (OPENAQ_API_KEY).',
    lastCheckedAt: checkedAt,
  };
}
