import type { EnvironmentalSnapshot, ProviderAdapterStatus } from '../../shared/types';

export interface CachedAdapterEntry<
  T extends { status: ProviderAdapterStatus; snapshots: EnvironmentalSnapshot[] },
> {
  expiresAtMs: number;
  result: T;
}

export const POLLUTANT_KEYS = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'] as const;

export function describeNetworkError(error: unknown): string {
  if (!(error instanceof Error)) return 'Connection failed';
  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as NodeJS.ErrnoException).code;
    return code
      ? `${error.message} (${code}: ${cause.message})`
      : `${error.message} (${cause.message})`;
  }
  return error.message;
}

export async function fetchWithRetry(
  url: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxAttempts?: number;
  } = {}
): Promise<Response> {
  const maxAttempts = options.maxAttempts ?? 2;
  const timeoutMs = options.timeoutMs ?? 6000;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(options.headers ?? {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
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

export function readCachedAdapterResult<
  T extends { status: ProviderAdapterStatus; snapshots: EnvironmentalSnapshot[] },
>(cache: Map<string, CachedAdapterEntry<T>>, cacheKey: string): T | null {
  const cached = cache.get(cacheKey);
  if (!cached || cached.expiresAtMs <= Date.now()) return null;

  const expiresIso = new Date(cached.expiresAtMs).toISOString();
  return {
    ...cached.result,
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

export function listMissingPollutants(pollutants: EnvironmentalSnapshot['pollutants']): string[] {
  return POLLUTANT_KEYS.filter((key) => pollutants[key] === undefined || pollutants[key] === null);
}
