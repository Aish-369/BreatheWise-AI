import { z } from 'zod';
import type { EnvironmentalSnapshot, ProviderAdapterStatus } from '../../shared/types';
import { findCityMetadata, normalizeCityCanonicalName } from '../../shared/indianCities';
import { classifyFreshness, classifySnapshotTier } from '../../engine/quality';
import type { AdapterFetchResult } from './openaq';

const CPCB_RESOURCE_ID = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
const CACHE_TTL_MS = 5 * 60 * 1000;
const cpcbCache = new Map<string, { expiresAtMs: number; result: AdapterFetchResult }>();

export function clearCpcbCache(): void {
  cpcbCache.clear();
}

const CpcbRecordSchema = z.object({
  station: z.string().optional(),
  city: z.string().optional(),
  last_update: z.string().optional(),
  pollutant_id: z.string().optional(),
  // The live data.gov.in resource exposes pollutant_avg. Keep avg_value as a
  // compatibility alias for older exports, but prefer the documented field.
  pollutant_avg: z.union([z.string(), z.number()]).nullable().optional(),
  avg_value: z.union([z.string(), z.number()]).nullable().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
});

const CpcbResponseSchema = z.object({
  records: z.array(CpcbRecordSchema).optional(),
});

const POLLUTANT_BOUNDS: Record<string, number> = {
  'PM2.5': 2000,
  PM10: 3000,
  NO2: 2000,
  OZONE: 1500,
  O3: 1500,
  SO2: 2000,
  CO: 100,
};

export function parseCpcbTimestamp(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();

  // CPCB often emits DD-MM-YYYY HH:mm:ss in IST (+05:30)
  const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (dmyMatch) {
    const [, dd, mm, yyyy, hh, min, sec = '00'] = dmyMatch;
    const isoCandidate = `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}+05:30`;
    const parsedMs = Date.parse(isoCandidate);
    if (!Number.isNaN(parsedMs)) {
      return new Date(parsedMs).toISOString();
    }
  }

  const parsedMs = Date.parse(trimmed);
  if (!Number.isNaN(parsedMs)) {
    return new Date(parsedMs).toISOString();
  }
  return null;
}

function describeNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return 'Connection failed';
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as NodeJS.ErrnoException).code;
    return code ? `${error.message} (${code}: ${cause.message})` : `${error.message} (${cause.message})`;
  }
  return error.message;
}

async function fetchCpcbWithRetry(url: string): Promise<Response> {
  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
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

  throw lastError instanceof Error ? lastError : new Error('Connection failed');
}

export async function fetchCpcbSnapshots(city: string): Promise<AdapterFetchResult> {
  const canonicalCity = normalizeCityCanonicalName(city);
  const cacheKey = canonicalCity.toLowerCase();
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim();
  const checkedAt = new Date().toISOString();

  const baseStatus: ProviderAdapterStatus = {
    provider: 'cpcb',
    name: 'CPCB / data.gov.in',
    configured: Boolean(apiKey),
    liveReachable: false,
    status: apiKey ? 'unavailable' : 'unconfigured',
    licenseName: 'Government Open Data License – India (GODL)',
    attributionText:
      'Contains data sourced from the Central Pollution Control Board (CPCB) via data.gov.in under GODL.',
    notes: apiKey
      ? 'API key configured on server.'
      : 'Requires free data.gov.in API key in DATA_GOV_IN_API_KEY; also blocked if outbound access to api.data.gov.in is restricted.',
    lastCheckedAt: checkedAt,
  };

  if (!apiKey) {
    return { status: baseStatus, snapshots: [] };
  }

  const cached = cpcbCache.get(cacheKey);
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

  // Handle legacy CPCB naming aliases (e.g., Ahmednagar -> Ahilyanagar, Aurangabad -> Chhatrapati Sambhajinagar)
  const cityMeta = findCityMetadata(canonicalCity);
  const queryCityName =
    canonicalCity === 'Ahilyanagar'
      ? 'Ahmednagar'
      : canonicalCity === 'Chhatrapati Sambhajinagar'
        ? 'Aurangabad'
        : canonicalCity === 'Aurangabad (Bihar)'
          ? 'Aurangabad'
          : canonicalCity;

  const params = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    limit: '100',
    offset: '0',
    'filters[city]': queryCityName,
  });
  if (cityMeta?.state) {
    // data.gov.in expects spaces in state names as underscores.
    params.set('filters[state]', cityMeta.state.replace(/\s+/g, '_'));
  }
  const url = `https://api.data.gov.in/resource/${CPCB_RESOURCE_ID}?${params.toString()}`;

  try {
    const res = await fetchCpcbWithRetry(url);

    if (!res.ok) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes:
            res.status === 429
              ? 'data.gov.in rate limit (HTTP 429) reached. Try again shortly.'
              : `data.gov.in responded with HTTP ${res.status}.`,
        },
        snapshots: [],
      };
    }

    const rawJson: unknown = await res.json();
    const parsed = CpcbResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes: 'CPCB payload failed Zod validation and was safely rejected.',
        },
        snapshots: [],
      };
    }

    const records = parsed.data.records ?? [];
    if (records.length === 0) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes: `CPCB endpoint returned 0 records for ${canonicalCity}.`,
        },
        snapshots: [],
      };
    }

    const byStation = new Map<
      string,
      { snap: EnvironmentalSnapshot; validatedFields: Set<string>; rejectedFields: string[] }
    >();

    for (const rec of records) {
      const station = rec.station?.trim() || `${canonicalCity} Station`;
      let entry = byStation.get(station);
      const rawValue = rec.pollutant_avg ?? rec.avg_value;
      const val = rawValue === null || rawValue === undefined || rawValue === '' ? NaN : Number(rawValue);
      const pid = rec.pollutant_id?.trim().toUpperCase();
      const measuredAt = parseCpcbTimestamp(rec.last_update);

      const lat = rec.latitude !== undefined ? Number(rec.latitude) : NaN;
      const lon = rec.longitude !== undefined ? Number(rec.longitude) : NaN;
      const coords =
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
          ? { latitude: lat, longitude: lon }
          : cityMeta
            ? { latitude: cityMeta.latitude, longitude: cityMeta.longitude }
            : null;

      if (!entry) {
        const freshness = classifyFreshness(measuredAt, checkedAt);
        const snap: EnvironmentalSnapshot = {
          id: `cpcb-${station.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          provider: 'cpcb',
          providerLabel: 'CPCB / data.gov.in',
          dataType: 'physical_station',
          city: canonicalCity,
          locationLabel: station,
          stationOrGridId: station,
          spatialResolutionNote: 'Official CPCB Continuous Ambient Air Quality Monitoring Station',
          pollutants: {},
          reportedAqiIndia: null,
          measuredAt,
          retrievedAt: checkedAt,
          freshness,
          licenseAttribution: baseStatus.attributionText,
          warnings: [],
          isDemoFixture: false,
          isAvailable: true,
          coordinates: coords,
        };
        entry = { snap, validatedFields: new Set(), rejectedFields: [] };
        byStation.set(station, entry);
      }

      if (measuredAt && (!entry.snap.measuredAt || measuredAt > entry.snap.measuredAt)) {
        entry.snap.measuredAt = measuredAt;
        entry.snap.freshness = classifyFreshness(measuredAt, checkedAt);
      }

      if (pid && pid in POLLUTANT_BOUNDS) {
        if (!Number.isFinite(val) || val < 0 || val > POLLUTANT_BOUNDS[pid]) {
          if (rawValue !== undefined && rawValue !== null && rawValue !== '' && rawValue !== 'NA') {
            entry.rejectedFields.push(`${pid}=${rawValue}`);
          }
        } else {
          if (pid === 'PM2.5') {
            entry.snap.pollutants.pm25 = val;
            entry.validatedFields.add('pm25');
          } else if (pid === 'PM10') {
            entry.snap.pollutants.pm10 = val;
            entry.validatedFields.add('pm10');
          } else if (pid === 'NO2') {
            entry.snap.pollutants.no2 = val;
            entry.validatedFields.add('no2');
          } else if (pid === 'OZONE' || pid === 'O3') {
            entry.snap.pollutants.o3 = val;
            entry.validatedFields.add('o3');
          } else if (pid === 'SO2') {
            entry.snap.pollutants.so2 = val;
            entry.validatedFields.add('so2');
          } else if (pid === 'CO') {
            entry.snap.pollutants.co = val;
            entry.validatedFields.add('co');
          }
        }
      }
    }

    const snapshots: EnvironmentalSnapshot[] = [];
    for (const { snap, validatedFields, rejectedFields } of byStation.values()) {
      const missingPollutants = (['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'] as const).filter(
        (key) => snap.pollutants[key] === undefined || snap.pollutants[key] === null
      );
      if (rejectedFields.length > 0) {
        snap.warnings.push(
          `Excluded invalid CPCB readings: ${rejectedFields.join(', ')}.`
        );
      }
      snap.isAvailable =
        Object.keys(snap.pollutants).length > 0 && snap.freshness !== 'unavailable';
      snap.classification = classifySnapshotTier(snap, snap.freshness);
      snap.qualityMetadata = {
        validatedFields: Array.from(validatedFields),
        missingPollutants: [...missingPollutants],
        rejectedFields: rejectedFields.length > 0 ? rejectedFields : undefined,
        fromCache: false,
      };
      if (snap.isAvailable) {
        snapshots.push(snap);
      }
    }

    const result: AdapterFetchResult = {
      status: {
        ...baseStatus,
        liveReachable: true,
        status: snapshots.length > 0 ? 'live' : 'unavailable',
        notes:
          snapshots.length > 0
            ? `Retrieved ${snapshots.length} validated station(s) from CPCB via data.gov.in.`
            : 'CPCB reachable, but no valid measurements matched range and timestamp checks.',
      },
      snapshots,
    };

    if (snapshots.length > 0) {
      cpcbCache.set(cacheKey, { expiresAtMs: Date.now() + CACHE_TTL_MS, result });
    }

    return result;
  } catch (err) {
    return {
      status: {
        ...baseStatus,
        liveReachable: false,
        status: 'unavailable',
        notes: `CPCB / data.gov.in unreachable: ${describeNetworkError(err)}`,
      },
      snapshots: [],
    };
  }
}
