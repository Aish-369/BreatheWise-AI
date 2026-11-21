import type { EnvironmentalSnapshot, ProviderAdapterStatus } from '../../shared/types';
import { classifyFreshness } from '../../engine/quality';
import type { AdapterFetchResult } from './openaq';

const CPCB_RESOURCE_ID = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';

export async function fetchCpcbSnapshots(city: string): Promise<AdapterFetchResult> {
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

  const queryCity = encodeURIComponent(city);
  const url = `https://api.data.gov.in/resource/${CPCB_RESOURCE_ID}?api-key=${encodeURIComponent(apiKey)}&format=json&limit=20&filters[city]=${queryCity}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes: `data.gov.in responded with HTTP ${res.status}.`,
        },
        snapshots: [],
      };
    }

    const data = (await res.json()) as {
      records?: Array<{
        station?: string;
        city?: string;
        last_update?: string;
        pollutant_id?: string;
        avg_value?: string | number;
      }>;
    };

    const records = data.records ?? [];
    if (records.length === 0) {
      return {
        status: {
          ...baseStatus,
          liveReachable: true,
          status: 'unavailable',
          notes: `CPCB endpoint returned 0 records for ${city}.`,
        },
        snapshots: [],
      };
    }

    const byStation = new Map<string, EnvironmentalSnapshot>();
    for (const rec of records) {
      const station = rec.station ?? `${city} Station`;
      const existing = byStation.get(station);
      const val = Number(rec.avg_value);
      const pid = rec.pollutant_id?.toUpperCase();
      const measuredAt = rec.last_update ? new Date(rec.last_update).toISOString() : null;

      const snap: EnvironmentalSnapshot = existing ?? {
        id: `cpcb-${station.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        provider: 'cpcb',
        providerLabel: 'CPCB / data.gov.in',
        dataType: 'physical_station',
        city,
        locationLabel: station,
        stationOrGridId: station,
        spatialResolutionNote: 'Official CPCB Continuous Ambient Air Quality Monitoring Station',
        pollutants: {},
        reportedAqiIndia: null,
        measuredAt,
        retrievedAt: checkedAt,
        freshness: classifyFreshness(measuredAt, checkedAt),
        licenseAttribution: baseStatus.attributionText,
        warnings: [],
        isDemoFixture: false,
        isAvailable: true,
      };

      if (Number.isFinite(val) && val >= 0) {
        if (pid === 'PM2.5') snap.pollutants.pm25 = val;
        if (pid === 'PM10') snap.pollutants.pm10 = val;
        if (pid === 'NO2') snap.pollutants.no2 = val;
        if (pid === 'OZONE' || pid === 'O3') snap.pollutants.o3 = val;
        if (pid === 'SO2') snap.pollutants.so2 = val;
        if (pid === 'CO') snap.pollutants.co = val;
      }

      byStation.set(station, snap);
    }

    const snapshots = Array.from(byStation.values());
    return {
      status: {
        ...baseStatus,
        liveReachable: true,
        status: 'live',
        notes: `Retrieved ${snapshots.length} station(s) from CPCB via data.gov.in.`,
      },
      snapshots,
    };
  } catch (err) {
    return {
      status: {
        ...baseStatus,
        liveReachable: false,
        status: 'unavailable',
        notes: `CPCB / data.gov.in unreachable: ${err instanceof Error ? err.message : 'Connection failed'}`,
      },
      snapshots: [],
    };
  }
}
