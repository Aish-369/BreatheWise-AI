import { normalizeCityCanonicalName } from '../../shared/indianCities';
import type { EnvironmentalSnapshot, ProviderAdapterStatus } from '../../shared/types';
import { type CachedAdapterEntry, fetchWithRetry, readCachedAdapterResult } from './httpClient';
import {
  buildBaseOpenAqStatus,
  buildOpenAqHeaders,
  buildOpenAqLocationsUrl,
  mapOpenAqLocationToSnapshot,
  type OpenAqLatestReading,
  OpenAqLatestPayloadSchema,
  type OpenAqLocation,
  parseOpenAqLocations,
} from './openaqMapper';

export interface AdapterFetchResult {
  status: ProviderAdapterStatus;
  snapshots: EnvironmentalSnapshot[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const openAqCache = new Map<string, CachedAdapterEntry<AdapterFetchResult>>();

export function clearOpenAqCache(): void {
  openAqCache.clear();
}

async function fetchLatestReadingsForLocation(
  loc: OpenAqLocation,
  apiKey: string
): Promise<{ loc: OpenAqLocation; readings: OpenAqLatestReading[] }> {
  try {
    const res = await fetchWithRetry(
      `https://api.openaq.org/v3/locations/${loc.id}/latest?limit=100&page=1`,
      { headers: buildOpenAqHeaders(apiKey) }
    );
    if (!res.ok) return { loc, readings: [] };
    const latestParsed = OpenAqLatestPayloadSchema.safeParse(await res.json());
    return { loc, readings: latestParsed.success ? (latestParsed.data.results ?? []) : [] };
  } catch {
    return { loc, readings: [] };
  }
}

export async function fetchOpenAqSnapshots(city: string): Promise<AdapterFetchResult> {
  const canonicalCity = normalizeCityCanonicalName(city);
  const cacheKey = canonicalCity.toLowerCase();
  const apiKey = process.env.OPENAQ_API_KEY?.trim();
  const checkedAt = new Date().toISOString();
  const baseStatus = buildBaseOpenAqStatus(apiKey, checkedAt);

  if (!apiKey) return { status: baseStatus, snapshots: [] };
  const cached = readCachedAdapterResult(openAqCache, cacheKey);
  if (cached) return cached;

  const { url, hasCoords } = buildOpenAqLocationsUrl(canonicalCity);
  try {
    const res = await fetchWithRetry(url, { headers: buildOpenAqHeaders(apiKey) });
    if (!res.ok) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          notes:
            res.status === 429
              ? 'OpenAQ rate limit (HTTP 429) reached. Try again shortly.'
              : `OpenAQ responded with HTTP ${res.status}. Live data unavailable.`,
        },
        snapshots: [],
      };
    }

    const locations = parseOpenAqLocations(await res.json(), canonicalCity, hasCoords);
    if (!locations) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          notes: 'OpenAQ response failed schema validation and was safely rejected.',
        },
        snapshots: [],
      };
    }

    const latestResults = await Promise.all(
      locations.slice(0, 3).map((loc) => fetchLatestReadingsForLocation(loc, apiKey))
    );
    const snapshots = latestResults
      .map(({ loc, readings }) =>
        mapOpenAqLocationToSnapshot(loc, readings, canonicalCity, checkedAt)
      )
      .filter((s): s is EnvironmentalSnapshot => s !== null);

    const result: AdapterFetchResult = {
      status: {
        ...baseStatus,
        liveReachable: true,
        status: snapshots.length > 0 ? 'live' : 'unavailable',
        notes:
          snapshots.length > 0
            ? `Retrieved ${snapshots.length} validated station(s) from OpenAQ v3.`
            : 'OpenAQ reachable, but no stations returned valid recent measurements for this city.',
      },
      snapshots,
    };
    if (snapshots.length > 0) {
      openAqCache.set(cacheKey, { expiresAtMs: Date.now() + CACHE_TTL_MS, result });
    }
    return result;
  } catch (err) {
    return {
      status: {
        ...baseStatus,
        notes: `OpenAQ request failed: ${err instanceof Error ? err.message : 'Network error'}`,
      },
      snapshots: [],
    };
  }
}
