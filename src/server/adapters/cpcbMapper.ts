import { z } from 'zod';
import { classifyFreshness, classifySnapshotTier } from '../../engine/quality';
import { findCityMetadata } from '../../shared/indianCities';
import type { EnvironmentalSnapshot, ProviderAdapterStatus } from '../../shared/types';
import { listMissingPollutants } from './httpClient';

const CPCB_RESOURCE_ID = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';

const CpcbRecordSchema = z.object({
  station: z.string().optional(),
  city: z.string().optional(),
  last_update: z.string().optional(),
  pollutant_id: z.string().optional(),
  pollutant_avg: z.union([z.string(), z.number()]).nullable().optional(),
  avg_value: z.union([z.string(), z.number()]).nullable().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
});

const CpcbResponseSchema = z.object({
  records: z.array(CpcbRecordSchema).optional(),
});

export type CpcbRecord = z.infer<typeof CpcbRecordSchema>;

interface StationAccumulator {
  snap: EnvironmentalSnapshot;
  validatedFields: Set<string>;
  rejectedFields: string[];
}

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
  const dmyMatch = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (dmyMatch) {
    const [, dd, mm, yyyy, hh, min, sec = '00'] = dmyMatch;
    const parsedMs = Date.parse(`${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}+05:30`);
    if (!Number.isNaN(parsedMs)) return new Date(parsedMs).toISOString();
  }
  const parsedMs = Date.parse(trimmed);
  return Number.isNaN(parsedMs) ? null : new Date(parsedMs).toISOString();
}

export function buildCpcbQueryUrl(canonicalCity: string, apiKey: string): string {
  const cityMeta = findCityMetadata(canonicalCity);
  const queryCityName =
    canonicalCity === 'Ahilyanagar'
      ? 'Ahmednagar'
      : canonicalCity === 'Chhatrapati Sambhajinagar' || canonicalCity === 'Aurangabad (Bihar)'
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
    params.set('filters[state]', cityMeta.state.replace(/\s+/g, '_'));
  }
  return `https://api.data.gov.in/resource/${CPCB_RESOURCE_ID}?${params.toString()}`;
}

export function parseCpcbPayload(rawJson: unknown): CpcbRecord[] | null {
  const parsed = CpcbResponseSchema.safeParse(rawJson);
  return parsed.success ? (parsed.data.records ?? []) : null;
}

function resolveRecordCoords(
  rec: CpcbRecord,
  cityMeta: ReturnType<typeof findCityMetadata>
): EnvironmentalSnapshot['coordinates'] {
  const lat = rec.latitude !== undefined ? Number(rec.latitude) : NaN;
  const lon = rec.longitude !== undefined ? Number(rec.longitude) : NaN;
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  ) {
    return { latitude: lat, longitude: lon };
  }
  return cityMeta ? { latitude: cityMeta.latitude, longitude: cityMeta.longitude } : null;
}

function assignCpcbPollutant(entry: StationAccumulator, pid: string, val: number): void {
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

function applyCpcbRecord(
  byStation: Map<string, StationAccumulator>,
  rec: CpcbRecord,
  canonicalCity: string,
  checkedAt: string,
  attributionText: string,
  cityMeta: ReturnType<typeof findCityMetadata>
): void {
  const station = rec.station?.trim() || `${canonicalCity} Station`;
  const measuredAt = parseCpcbTimestamp(rec.last_update);
  let entry = byStation.get(station);

  if (!entry) {
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
      freshness: classifyFreshness(measuredAt, checkedAt),
      licenseAttribution: attributionText,
      warnings: [],
      isDemoFixture: false,
      isAvailable: true,
      coordinates: resolveRecordCoords(rec, cityMeta),
    };
    entry = { snap, validatedFields: new Set(), rejectedFields: [] };
    byStation.set(station, entry);
  }

  if (measuredAt && (!entry.snap.measuredAt || measuredAt > entry.snap.measuredAt)) {
    entry.snap.measuredAt = measuredAt;
    entry.snap.freshness = classifyFreshness(measuredAt, checkedAt);
  }

  const rawValue = rec.pollutant_avg ?? rec.avg_value;
  const val =
    rawValue === null || rawValue === undefined || rawValue === '' ? NaN : Number(rawValue);
  const pid = rec.pollutant_id?.trim().toUpperCase();
  if (!pid || !(pid in POLLUTANT_BOUNDS)) return;

  if (!Number.isFinite(val) || val < 0 || val > POLLUTANT_BOUNDS[pid]) {
    if (rawValue !== undefined && rawValue !== null && rawValue !== '' && rawValue !== 'NA') {
      entry.rejectedFields.push(`${pid}=${rawValue}`);
    }
    return;
  }
  assignCpcbPollutant(entry, pid, val);
}

export function mapCpcbRecordsToSnapshots(
  records: CpcbRecord[],
  canonicalCity: string,
  checkedAt: string,
  attributionText: string
): EnvironmentalSnapshot[] {
  const cityMeta = findCityMetadata(canonicalCity);
  const byStation = new Map<string, StationAccumulator>();
  for (const rec of records) {
    applyCpcbRecord(byStation, rec, canonicalCity, checkedAt, attributionText, cityMeta);
  }

  const snapshots: EnvironmentalSnapshot[] = [];
  for (const { snap, validatedFields, rejectedFields } of byStation.values()) {
    if (rejectedFields.length > 0) {
      snap.warnings.push(`Excluded invalid CPCB readings: ${rejectedFields.join(', ')}.`);
    }
    snap.isAvailable = Object.keys(snap.pollutants).length > 0 && snap.freshness !== 'unavailable';
    snap.classification = classifySnapshotTier(snap, snap.freshness);
    snap.qualityMetadata = {
      validatedFields: Array.from(validatedFields),
      missingPollutants: listMissingPollutants(snap.pollutants),
      rejectedFields: rejectedFields.length > 0 ? rejectedFields : undefined,
      fromCache: false,
    };
    if (snap.isAvailable) snapshots.push(snap);
  }
  return snapshots;
}

export function buildBaseCpcbStatus(
  apiKey: string | undefined,
  checkedAt: string
): ProviderAdapterStatus {
  return {
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
}
