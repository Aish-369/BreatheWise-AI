import type { EnvironmentalSnapshot, ProviderAdapterStatus } from '../../shared/types';
import { classifyFreshness } from '../../engine/quality';

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  pune: { lat: 18.5204, lon: 73.8567 },
  ahilyanagar: { lat: 19.0948, lon: 74.748 },
};

export interface AdapterFetchResult {
  status: ProviderAdapterStatus;
  snapshots: EnvironmentalSnapshot[];
}

export async function fetchOpenAqSnapshots(city: string): Promise<AdapterFetchResult> {
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

  const coords = CITY_COORDS[city.toLowerCase()];
  const url = coords
    ? `https://api.openaq.org/v3/locations?coordinates=${coords.lat},${coords.lon}&radius=25000&limit=5`
    : `https://api.openaq.org/v3/locations?iso=IN&limit=5`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes: `OpenAQ responded with HTTP ${res.status}. Live data unavailable.`,
        },
        snapshots: [],
      };
    }

    const payload = (await res.json()) as {
      results?: Array<{
        id: number;
        name?: string;
        locality?: string;
        datetimeLast?: { utc?: string };
        sensors?: Array<{
          parameter?: { name?: string; units?: string };
          latest?: { value?: number; datetime?: { utc?: string } };
        }>;
      }>;
    };

    const results = payload.results ?? [];
    const snapshots: EnvironmentalSnapshot[] = [];

    for (const loc of results.slice(0, 2)) {
      const pollutants: EnvironmentalSnapshot['pollutants'] = {};
      let latestIso: string | null = loc.datetimeLast?.utc ?? null;

      for (const s of loc.sensors ?? []) {
        const param = s.parameter?.name?.toLowerCase();
        const val = s.latest?.value;
        if (typeof val !== 'number' || val < 0) continue;
        if (param === 'pm25') pollutants.pm25 = Math.round(val * 10) / 10;
        if (param === 'pm10') pollutants.pm10 = Math.round(val * 10) / 10;
        if (param === 'no2') pollutants.no2 = Math.round(val * 10) / 10;
        if (param === 'o3') pollutants.o3 = Math.round(val * 10) / 10;
        if (param === 'so2') pollutants.so2 = Math.round(val * 10) / 10;
        if (param === 'co') pollutants.co = Math.round(val * 100) / 100;
        if (s.latest?.datetime?.utc && (!latestIso || s.latest.datetime.utc > latestIso)) {
          latestIso = s.latest.datetime.utc;
        }
      }

      const freshness = classifyFreshness(latestIso, checkedAt);
      snapshots.push({
        id: `openaq-${loc.id}`,
        provider: 'openaq',
        providerLabel: 'OpenAQ API v3',
        dataType: 'physical_station',
        city,
        locationLabel: loc.name || loc.locality || city,
        stationOrGridId: `OPENAQ-LOC-${loc.id}`,
        spatialResolutionNote: 'Physical monitoring station reported via OpenAQ v3',
        pollutants,
        reportedAqiIndia: null,
        measuredAt: latestIso,
        retrievedAt: checkedAt,
        freshness,
        licenseAttribution: 'Source aggregated by OpenAQ API v3 (per-source open license)',
        warnings: [],
        isDemoFixture: false,
        isAvailable: Object.keys(pollutants).length > 0,
      });
    }

    return {
      status: {
        ...baseStatus,
        liveReachable: true,
        status: snapshots.length > 0 ? 'live' : 'unavailable',
        notes:
          snapshots.length > 0
            ? `Retrieved ${snapshots.length} station(s) from OpenAQ v3.`
            : 'OpenAQ reachable, but no stations returned recent measurements for this query.',
      },
      snapshots,
    };
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
