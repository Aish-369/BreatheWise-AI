import { z } from 'zod';
import type {
  EnvironmentalSnapshot,
  ProviderAdapterStatus,
  WeatherFields,
} from '../../shared/types';
import { findCityMetadata, normalizeCityCanonicalName } from '../../shared/indianCities';
import { classifyFreshness, classifySnapshotTier } from '../../engine/quality';

export interface AdapterFetchResult {
  status: ProviderAdapterStatus;
  snapshots: EnvironmentalSnapshot[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const openAqCache = new Map<string, { expiresAtMs: number; result: AdapterFetchResult }>();

export function clearOpenAqCache(): void {
  openAqCache.clear();
}

const OpenAqSensorSchema = z.object({
  id: z.number(),
  parameter: z
    .object({
      name: z.string().optional(),
      units: z.string().optional(),
    })
    .optional(),
  latest: z
    .object({
      value: z.number().optional(),
      datetime: z
        .object({
          utc: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

const OpenAqLocationSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  locality: z.string().nullable().optional(),
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  datetimeLast: z
    .object({
      utc: z.string().optional(),
    })
    .optional(),
  sensors: z.array(OpenAqSensorSchema).optional(),
});

const OpenAqPayloadSchema = z.object({
  results: z.array(OpenAqLocationSchema).optional(),
});

const OpenAqLatestPayloadSchema = z.object({
  results: z.array(z.object({
    value: z.number(),
    datetime: z.object({ utc: z.string() }),
    sensorsId: z.number(),
  })).optional(),
});

async function fetchWithRetry(url: string, apiKey: string): Promise<Response> {
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
        const retryAfterSec = Number(res.headers.get('retry-after'));
        const delayMs =
          Number.isFinite(retryAfterSec) && retryAfterSec > 0
            ? Math.min(1000, retryAfterSec * 1000)
            : 250;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Network error');
}

const POLLUTANT_BOUNDS: Record<string, number> = {
  pm25: 2000,
  pm10: 3000,
  no2: 2000,
  o3: 1500,
  so2: 2000,
  co: 100,
};

export async function fetchOpenAqSnapshots(city: string): Promise<AdapterFetchResult> {
  const canonicalCity = normalizeCityCanonicalName(city);
  const cacheKey = canonicalCity.toLowerCase();
  const apiKey = process.env.OPENAQ_API_KEY?.trim();
  const checkedAt = new Date().toISOString();

  const baseStatus: ProviderAdapterStatus = {
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

  if (!apiKey) {
    return { status: baseStatus, snapshots: [] };
  }

  const cached = openAqCache.get(cacheKey);
  if (cached && cached.expiresAtMs > Date.now()) {
    const expiresIso = new Date(cached.expiresAtMs).toISOString();
    return {
      status: {
        ...cached.result.status,
        notes: `${cached.result.status.notes} (served from server TTL cache)`,
      },
      snapshots: cached.result.snapshots.map((s) => ({
        ...s,
        qualityMetadata: {
          validatedFields: s.qualityMetadata?.validatedFields ?? [],
          missingPollutants: s.qualityMetadata?.missingPollutants ?? [],
          rejectedFields: s.qualityMetadata?.rejectedFields,
          fromCache: true,
          cacheExpiresAt: expiresIso,
        },
      })),
    };
  }

  const cityMeta = findCityMetadata(canonicalCity);
  const url = cityMeta
    ? `https://api.openaq.org/v3/locations?coordinates=${cityMeta.latitude},${cityMeta.longitude}&radius=25000&limit=5`
    : `https://api.openaq.org/v3/locations?iso=IN&limit=30`;

  try {
    const res = await fetchWithRetry(url, apiKey);

    if (!res.ok) {
      const notes =
        res.status === 429
          ? 'OpenAQ rate limit (HTTP 429) reached. Try again shortly.'
          : `OpenAQ responded with HTTP ${res.status}. Live data unavailable.`;
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes,
        },
        snapshots: [],
      };
    }

    const rawJson: unknown = await res.json();
    const parsed = OpenAqPayloadSchema.safeParse(rawJson);
    if (!parsed.success) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes: 'OpenAQ response failed schema validation and was safely rejected.',
        },
        snapshots: [],
      };
    }

    let results = parsed.data.results ?? [];
    if (!cityMeta) {
      const targetLower = canonicalCity.toLowerCase();
      results = results.filter(
        (loc) =>
          (loc.locality && loc.locality.toLowerCase().includes(targetLower)) ||
          (loc.name && loc.name.toLowerCase().includes(targetLower))
      );
    }

    const snapshots: EnvironmentalSnapshot[] = [];

    // OpenAQ v3 /locations returns station metadata and sensor definitions,
    // not the latest measurement series. Fetch the documented /latest resource
    // for each selected location and join readings to sensors by sensorsId.
    const latestResults = await Promise.all(
      results.slice(0, 3).map(async (loc) => {
        try {
          const latestResponse = await fetchWithRetry(
            `https://api.openaq.org/v3/locations/${loc.id}/latest?limit=100&page=1`,
            apiKey
          );
          if (!latestResponse.ok) return { loc, readings: [] as z.infer<typeof OpenAqLatestPayloadSchema>['results'] };
          const latestJson: unknown = await latestResponse.json();
          const latestParsed = OpenAqLatestPayloadSchema.safeParse(latestJson);
          return { loc, readings: latestParsed.success ? latestParsed.data.results ?? [] : [] };
        } catch {
          return { loc, readings: [] as z.infer<typeof OpenAqLatestPayloadSchema>['results'] };
        }
      })
    );

    for (const { loc, readings } of latestResults) {
      const pollutants: EnvironmentalSnapshot['pollutants'] = {};
      const weather: WeatherFields = {};
      const validatedFields: string[] = [];
      const rejectedFields: string[] = [];
      const parameterBySensorId = new Map(
        (loc.sensors ?? []).map((sensor) => [sensor.id, sensor.parameter?.name?.toLowerCase() ?? ''])
      );
      let latestIso: string | null = null;

      for (const reading of readings ?? []) {
        const param = parameterBySensorId.get(reading.sensorsId);
        const val = reading.value;
        if (!param || !Number.isFinite(val)) continue;

        if (param in POLLUTANT_BOUNDS) {
          const maxBound = POLLUTANT_BOUNDS[param];
          if (val < 0 || val > maxBound) {
            rejectedFields.push(`${param}=${val}`);
            continue;
          }
          if (param === 'pm25') pollutants.pm25 = Math.round(val * 10) / 10;
          if (param === 'pm10') pollutants.pm10 = Math.round(val * 10) / 10;
          if (param === 'no2') pollutants.no2 = Math.round(val * 10) / 10;
          if (param === 'o3') pollutants.o3 = Math.round(val * 10) / 10;
          if (param === 'so2') pollutants.so2 = Math.round(val * 10) / 10;
          if (param === 'co') pollutants.co = Math.round(val * 100) / 100;
          validatedFields.push(param);
        } else if (param === 'temperature' && val >= -40 && val <= 65) {
          weather.temperatureC = Math.round(val * 10) / 10;
          validatedFields.push('temperatureC');
        } else if (
          (param === 'relativehumidity' || param === 'humidity') &&
          val >= 0 &&
          val <= 100
        ) {
          weather.relativeHumidityPct = Math.round(val * 10) / 10;
          validatedFields.push('relativeHumidityPct');
        } else if (param === 'wind_speed' && val >= 0 && val <= 120) {
          weather.windSpeedMs = Math.round(val * 10) / 10;
          validatedFields.push('windSpeedMs');
        }

        if (!latestIso || reading.datetime.utc > latestIso) latestIso = reading.datetime.utc;
      }

      const missingPollutants = (['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'] as const).filter(
        (key) => pollutants[key] === undefined || pollutants[key] === null
      );

      const warnings: string[] = [];
      if (rejectedFields.length > 0) {
        warnings.push(
          `Excluded out-of-range sensor reading(s) from upstream report: ${rejectedFields.join(', ')}.`
        );
      }

      const freshness = classifyFreshness(latestIso, checkedAt);
      const hasPollutants = Object.keys(pollutants).length > 0;
      const draftSnap: EnvironmentalSnapshot = {
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
        isAvailable: hasPollutants && freshness !== 'unavailable',
        coordinates: loc.coordinates ?? null,
        weather: Object.keys(weather).length > 0 ? weather : undefined,
        qualityMetadata: {
          validatedFields,
          missingPollutants: [...missingPollutants],
          rejectedFields: rejectedFields.length > 0 ? rejectedFields : undefined,
          fromCache: false,
        },
      };

      draftSnap.classification = classifySnapshotTier(draftSnap, freshness);
      if (draftSnap.isAvailable) snapshots.push(draftSnap);
    }

    const availableSnapshots = snapshots.filter((s) => s.isAvailable);
    const result: AdapterFetchResult = {
      status: {
        ...baseStatus,
        liveReachable: true,
        status: availableSnapshots.length > 0 ? 'live' : 'unavailable',
        notes:
          availableSnapshots.length > 0
            ? `Retrieved ${availableSnapshots.length} validated station(s) from OpenAQ v3.`
            : 'OpenAQ reachable, but no stations returned valid recent measurements for this city.',
      },
      snapshots: availableSnapshots,
    };

    if (availableSnapshots.length > 0) {
      openAqCache.set(cacheKey, { expiresAtMs: Date.now() + CACHE_TTL_MS, result });
    }

    return result;
  } catch (err) {
    return {
      status: {
        ...baseStatus,
        liveReachable: false,
        status: 'unavailable',
        notes: `OpenAQ request failed: ${err instanceof Error ? err.message : 'Network error'}`,
      },
      snapshots: [],
    };
  }
}
