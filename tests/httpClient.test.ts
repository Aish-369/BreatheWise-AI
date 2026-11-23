import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  describeNetworkError,
  fetchWithRetry,
  listMissingPollutants,
  readCachedAdapterResult,
  type CachedAdapterEntry,
} from '../src/server/adapters/httpClient';
import type { EnvironmentalSnapshot, ProviderAdapterStatus } from '../src/shared/types';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makeEntry(expiresAtMs: number): CachedAdapterEntry<{
  status: ProviderAdapterStatus;
  snapshots: EnvironmentalSnapshot[];
}> {
  const snap: EnvironmentalSnapshot = {
    id: 'snap-cache',
    provider: 'openaq',
    providerLabel: 'OpenAQ',
    dataType: 'physical_station',
    city: 'Pune',
    locationLabel: 'Shivajinagar',
    stationOrGridId: 'AQ-1',
    spatialResolutionNote: 'Station',
    pollutants: { pm25: 50 },
    reportedAqiIndia: 85,
    measuredAt: '2026-11-22T08:00:00.000Z',
    retrievedAt: '2026-11-22T08:05:00.000Z',
    freshness: 'fresh',
    licenseAttribution: 'CC-BY',
    warnings: [],
    isDemoFixture: false,
    isAvailable: true,
    qualityMetadata: {
      validatedFields: ['pm25'],
      missingPollutants: ['pm10', 'no2', 'o3', 'so2', 'co'],
      fromCache: false,
    },
  };
  return {
    expiresAtMs,
    result: {
      status: {
        provider: 'openaq',
        name: 'OpenAQ',
        configured: true,
        liveReachable: true,
        status: 'live',
        licenseName: 'CC-BY',
        attributionText: 'OpenAQ contributors',
        lastCheckedAt: '2026-11-22T08:05:00.000Z',
        notes: 'Live station read',
      },
      snapshots: [snap],
    },
  };
}

describe('server/adapters/httpClient', () => {
  it('describes nested network errors including errno codes and handles non-Error values', () => {
    expect(describeNetworkError('plain failure')).toBe('Connection failed');
    expect(describeNetworkError(new Error('Simple timeout'))).toBe('Simple timeout');

    const rootCause = Object.assign(new Error('getaddrinfo ENOTFOUND api.openaq.org'), {
      code: 'ENOTFOUND',
    });
    const topErr = new Error('fetch failed', { cause: rootCause });
    expect(describeNetworkError(topErr)).toBe(
      'fetch failed (ENOTFOUND: getaddrinfo ENOTFOUND api.openaq.org)'
    );
  });

  it('retries on 429 and 503 responses and succeeds when subsequent attempt returns 200', async () => {
    const fetchSpy = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('rate limited', { status: 429, headers: { 'retry-after': '0.01' } })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    const res = await fetchWithRetry('https://api.example/stations', {
      headers: { 'X-API-Key': 'test-key' },
      maxAttempts: 2,
      timeoutMs: 2000,
    });
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const firstCallInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((firstCallInit.headers as Record<string, string>)['X-API-Key']).toBe('test-key');
    expect(firstCallInit.signal).toBeInstanceOf(AbortSignal);
  });

  it('propagates network or timeout errors after exhausting maxAttempts', async () => {
    const timeoutErr = new DOMException('The operation timed out.', 'TimeoutError');
    const fetchSpy = vi.fn<typeof fetch>().mockRejectedValue(timeoutErr);
    vi.stubGlobal('fetch', fetchSpy);

    await expect(
      fetchWithRetry('https://api.example/slow', { maxAttempts: 2, timeoutMs: 25 })
    ).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('returns null on TTL cache miss/expiry and stamps cache metadata on hit', () => {
    const cache = new Map<
      string,
      CachedAdapterEntry<{ status: ProviderAdapterStatus; snapshots: EnvironmentalSnapshot[] }>
    >();
    cache.set('expired', makeEntry(Date.now() - 1000));
    cache.set('fresh', makeEntry(Date.now() + 60_000));

    expect(readCachedAdapterResult(cache, 'missing')).toBeNull();
    expect(readCachedAdapterResult(cache, 'expired')).toBeNull();

    const hit = readCachedAdapterResult(cache, 'fresh');
    expect(hit).not.toBeNull();
    expect(hit!.status.notes).toContain('(served from server TTL cache)');
    expect(hit!.snapshots[0].qualityMetadata?.fromCache).toBe(true);
    expect(hit!.snapshots[0].qualityMetadata?.cacheExpiresAt).toBeTruthy();
  });

  it('lists all missing pollutant keys accurately', () => {
    expect(listMissingPollutants({ pm25: 35, o3: 40 })).toEqual(['pm10', 'no2', 'so2', 'co']);
    expect(listMissingPollutants({ pm25: 10, pm10: 20, no2: 30, o3: 40, so2: 5, co: 1 })).toEqual(
      []
    );
  });
});
