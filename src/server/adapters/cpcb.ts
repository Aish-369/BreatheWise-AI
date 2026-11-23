import { normalizeCityCanonicalName } from '../../shared/indianCities';
import {
  buildBaseCpcbStatus,
  buildCpcbQueryUrl,
  mapCpcbRecordsToSnapshots,
  parseCpcbPayload,
  parseCpcbTimestamp,
} from './cpcbMapper';
import {
  type CachedAdapterEntry,
  describeNetworkError,
  fetchWithRetry,
  readCachedAdapterResult,
} from './httpClient';
import type { AdapterFetchResult } from './openaq';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cpcbCache = new Map<string, CachedAdapterEntry<AdapterFetchResult>>();

export { parseCpcbTimestamp };

export function clearCpcbCache(): void {
  cpcbCache.clear();
}

export async function fetchCpcbSnapshots(city: string): Promise<AdapterFetchResult> {
  const canonicalCity = normalizeCityCanonicalName(city);
  const cacheKey = canonicalCity.toLowerCase();
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim();
  const checkedAt = new Date().toISOString();
  const baseStatus = buildBaseCpcbStatus(apiKey, checkedAt);

  if (!apiKey) return { status: baseStatus, snapshots: [] };
  const cached = readCachedAdapterResult(cpcbCache, cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithRetry(buildCpcbQueryUrl(canonicalCity, apiKey));
    if (!res.ok) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          notes:
            res.status === 429
              ? 'data.gov.in rate limit (HTTP 429) reached. Try again shortly.'
              : `data.gov.in responded with HTTP ${res.status}.`,
        },
        snapshots: [],
      };
    }

    const records = parseCpcbPayload(await res.json());
    if (!records) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          notes: 'CPCB payload failed Zod validation and was safely rejected.',
        },
        snapshots: [],
      };
    }
    if (records.length === 0) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          notes: `CPCB endpoint returned 0 records for ${canonicalCity}.`,
        },
        snapshots: [],
      };
    }

    const snapshots = mapCpcbRecordsToSnapshots(
      records,
      canonicalCity,
      checkedAt,
      baseStatus.attributionText
    );
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
        notes: `CPCB / data.gov.in unreachable: ${describeNetworkError(err)}`,
      },
      snapshots: [],
    };
  }
}
