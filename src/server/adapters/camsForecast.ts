import type { ForecastSlot, ProviderAdapterStatus } from '../../shared/types';
import { findCityMetadata, normalizeCityCanonicalName } from '../../shared/indianCities';
import { deriveAqiFromPollutants } from '../../engine/quality';

const WINDOWS = [
  { value: '06:00-09:00' as const, start: 6, end: 9 },
  { value: '09:00-12:00' as const, start: 9, end: 12 },
  { value: '12:00-16:00' as const, start: 12, end: 16 },
  { value: '16:00-19:00' as const, start: 16, end: 19 },
  { value: '19:00-22:00' as const, start: 19, end: 22 },
];

type AirQualityPayload = {
  latitude?: number;
  longitude?: number;
  hourly?: {
    time?: string[];
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
  };
};

function mean(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  if (!valid.length) return null;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

export async function fetchAutomaticCamsForecast(city: string): Promise<{
  status: ProviderAdapterStatus;
  slots: ForecastSlot[];
}> {
  const checkedAt = new Date().toISOString();
  const canonicalCity = normalizeCityCanonicalName(city);
  const cityMeta = findCityMetadata(canonicalCity);
  const base: ProviderAdapterStatus = {
    provider: 'cams_auto',
    name: 'Copernicus CAMS Global via Open-Meteo',
    configured: true,
    liveReachable: false,
    status: 'unavailable',
    licenseName: 'CAMS Open Licence; Open-Meteo data attribution (CC BY 4.0)',
    attributionText: `CAMS Global Atmospheric Composition Forecasts. Data access and processing by Open-Meteo (CC BY 4.0). Retrieved ${checkedAt.slice(0, 10)}.`,
    notes: cityMeta
      ? 'Automatic coarse-grid forecast; approximately 45 km resolution. Not a physical station reading.'
      : 'No coordinates are registered for this city; automatic CAMS forecast is unavailable.',
    lastCheckedAt: checkedAt,
  };

  if (!cityMeta) return { status: base, slots: [] };

  const params = new URLSearchParams({
    latitude: String(cityMeta.latitude),
    longitude: String(cityMeta.longitude),
    hourly: 'pm2_5,pm10',
    forecast_days: '5',
    timezone: 'Asia/Kolkata',
    timeformat: 'iso8601',
    domains: 'cams_global',
  });

  try {
    const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return {
        status: { ...base, liveReachable: true, notes: `Open-Meteo CAMS endpoint responded with HTTP ${response.status}; forecast unavailable.` },
        slots: [],
      };
    }

    const payload = await response.json() as AirQualityPayload;
    const times = payload.hourly?.time;
    const pm25 = payload.hourly?.pm2_5;
    const pm10 = payload.hourly?.pm10;
    if (!Array.isArray(times) || !Array.isArray(pm25) || !Array.isArray(pm10) || !times.length || times.length !== pm25.length || times.length !== pm10.length) {
      return {
        status: { ...base, liveReachable: true, notes: 'CAMS response did not contain aligned hourly PM2.5 and PM10 arrays; payload rejected.' },
        slots: [],
      };
    }

    const localNow = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata', hour12: false }).replace(' ', 'T').slice(0, 16);
    const rows = times.map((time, index) => ({
      time,
      pm25: pm25[index] ?? null,
      pm10: pm10[index] ?? null,
    })).filter((row) => Number.isFinite(Date.parse(row.time)) && row.time >= localNow);

    const grouped = new Map<string, { pm25: Array<number | null>; pm10: Array<number | null> }>();
    for (const row of rows) {
      const date = row.time.slice(0, 10);
      const hour = Number(row.time.slice(11, 13));
      const window = WINDOWS.find((item) => hour >= item.start && hour < item.end);
      if (!window) continue;
      const key = `${date}|${window.value}`;
      const bucket = grouped.get(key) ?? { pm25: [], pm10: [] };
      bucket.pm25.push(row.pm25);
      bucket.pm10.push(row.pm10);
      grouped.set(key, bucket);
    }

    const ordered = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
    const slots: ForecastSlot[] = [];
    let previous: number | null = null;
    for (const [key, values] of ordered) {
      const [forecastDate, timeWindow] = key.split('|') as [string, ForecastSlot['timeWindow']];
      const expectedPm25 = mean(values.pm25);
      const expectedPm10 = mean(values.pm10);
      if (expectedPm25 === null && expectedPm10 === null) continue;
      const trend = previous === null || expectedPm25 === null
        ? 'unknown'
        : expectedPm25 < previous * 0.9 ? 'improving'
        : expectedPm25 > previous * 1.1 ? 'worsening'
        : 'stable';
      const aqi = deriveAqiFromPollutants({ pm25: expectedPm25, pm10: expectedPm10 });
      slots.push({
        id: `cams-auto-${canonicalCity.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${forecastDate}-${timeWindow.replace(/:/g, '')}`,
        city: canonicalCity,
        timeWindow,
        forecastDate,
        expectedPm25,
        expectedPm10,
        expectedAqiIndia: aqi.aqi,
        trend,
        dataType: 'forecast',
        providerLabel: 'Copernicus CAMS Global via Open-Meteo',
        gridResolutionNote: 'CAMS Global atmospheric composition forecast (~45 km grid, 3-hourly model); regional trend only, not street-level or station measurement.',
        issuedAt: checkedAt,
        licenseAttribution: 'Generated using Copernicus Atmosphere Monitoring Service information. Air quality data accessed via Open-Meteo; attribution required (CC BY 4.0).',
        isDemoFixture: false,
      });
      if (expectedPm25 !== null) previous = expectedPm25;
    }

    return {
      status: {
        ...base,
        liveReachable: true,
        status: slots.length ? 'forecast' : 'unavailable',
        notes: slots.length
          ? `Retrieved ${slots.length} coarse-grid forecast windows for ${canonicalCity}. This is modeled forecast data, not a live station reading.`
          : 'CAMS endpoint responded but no valid forecast windows were available.',
      },
      slots,
    };
  } catch (error) {
    return {
      status: {
        ...base,
        liveReachable: false,
        notes: `Automatic CAMS forecast request failed: ${error instanceof Error ? error.message : 'network error'}.`,
      },
      slots: [],
    };
  }
}
