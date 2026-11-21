import {
  CamsImportPayloadSchema,
  type ForecastSlot,
  type ProviderAdapterStatus,
  type TimeWindow,
} from '../../shared/types';
import { deriveAqiFromPollutants } from '../../engine/quality';

export const CAMS_LICENSE_TEXT = `Generated using Copernicus Atmosphere Monitoring Service information ${new Date().getFullYear()}`;

export function getCamsAdapterStatus(): ProviderAdapterStatus {
  return {
    provider: 'cams_manual',
    name: 'Copernicus CAMS (Manual Import)',
    configured: true,
    liveReachable: false,
    status: 'manual_import',
    licenseName: 'Copernicus Open License (Free, Worldwide, Commercial Allowed)',
    attributionText: CAMS_LICENSE_TEXT,
    notes:
      'Accepts validated JSON or CSV CAMS coarse-grid forecast imports. Never implies street-level precision.',
    lastCheckedAt: new Date().toISOString(),
  };
}

const VALID_WINDOWS = new Set<TimeWindow>([
  '06:00-09:00',
  '09:00-12:00',
  '12:00-16:00',
  '16:00-19:00',
  '19:00-22:00',
]);

export function parseCamsImport(rawText: string): {
  ok: boolean;
  slots?: ForecastSlot[];
  city?: string;
  error?: string;
} {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, error: 'Import payload is empty.' };
  }

  // Try JSON first
  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed);
      const parsed = CamsImportPayloadSchema.safeParse(json);
      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        };
      }
      const slots: ForecastSlot[] = parsed.data.slots.map((s) => {
        const derived = deriveAqiFromPollutants({
          pm25: s.expectedPm25,
          pm10: s.expectedPm10 ?? null,
        });
        return {
          id: `cams-${parsed.data.city.toLowerCase()}-${s.timeWindow}-${Date.now()}`,
          city: parsed.data.city,
          timeWindow: s.timeWindow,
          forecastDate: s.forecastDate,
          expectedPm25: s.expectedPm25,
          expectedPm10: s.expectedPm10 ?? null,
          expectedAqiIndia: s.expectedAqiIndia ?? derived.aqi,
          trend: s.trend,
          dataType: 'forecast',
          providerLabel: `Copernicus CAMS (${parsed.data.gridId})`,
          gridResolutionNote:
            'Coarse regional atmospheric model grid (~40 km); indicates general trend only, not street-level concentration.',
          issuedAt: parsed.data.issuedAt,
          licenseAttribution: CAMS_LICENSE_TEXT,
          isDemoFixture: false,
        };
      });
      return { ok: true, slots, city: parsed.data.city };
    } catch (e) {
      return { ok: false, error: `Invalid JSON format: ${e instanceof Error ? e.message : 'Parse error'}` };
    }
  }

  // Parse CSV: header -> city,grid_id,forecast_date,time_window,expected_pm25,expected_pm10,trend
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return {
      ok: false,
      error:
        'CSV requires a header row and at least one forecast row (city,grid_id,forecast_date,time_window,expected_pm25,expected_pm10,trend).',
    };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (col: string) => header.indexOf(col);
  if (idx('city') < 0 || idx('time_window') < 0 || idx('expected_pm25') < 0) {
    return {
      ok: false,
      error: 'CSV header must contain at least: city, time_window, expected_pm25.',
    };
  }

  const slots: ForecastSlot[] = [];
  let detectedCity = '';
  const nowIso = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const city = cols[idx('city')] || 'Pune';
    detectedCity = city;
    const gridId = idx('grid_id') >= 0 ? cols[idx('grid_id')] || 'CAMS-GLOBAL-0.4DEG' : 'CAMS-GLOBAL-0.4DEG';
    const forecastDate =
      idx('forecast_date') >= 0 ? cols[idx('forecast_date')] || nowIso.slice(0, 10) : nowIso.slice(0, 10);
    const tw = cols[idx('time_window')] as TimeWindow;
    if (!VALID_WINDOWS.has(tw)) {
      return {
        ok: false,
        error: `Row ${i + 1}: invalid time_window "${tw}". Expected one of 06:00-09:00, 09:00-12:00, 12:00-16:00, 16:00-19:00, 19:00-22:00.`,
      };
    }
    const pm25 = Number(cols[idx('expected_pm25')]);
    if (!Number.isFinite(pm25) || pm25 < 0 || pm25 > 2000) {
      return { ok: false, error: `Row ${i + 1}: invalid expected_pm25 value.` };
    }
    const pm10Raw = idx('expected_pm10') >= 0 ? Number(cols[idx('expected_pm10')]) : NaN;
    const pm10 = Number.isFinite(pm10Raw) && pm10Raw >= 0 ? pm10Raw : null;
    const trendRaw = idx('trend') >= 0 ? cols[idx('trend')] : 'stable';
    const trend =
      trendRaw === 'improving' || trendRaw === 'worsening' || trendRaw === 'stable'
        ? trendRaw
        : 'stable';

    const derived = deriveAqiFromPollutants({ pm25, pm10 });
    slots.push({
      id: `cams-csv-${city.toLowerCase()}-${tw}-${Date.now()}-${i}`,
      city,
      timeWindow: tw,
      forecastDate,
      expectedPm25: pm25,
      expectedPm10: pm10,
      expectedAqiIndia: derived.aqi,
      trend,
      dataType: 'forecast',
      providerLabel: `Copernicus CAMS (${gridId})`,
      gridResolutionNote:
        'Coarse regional atmospheric model grid (~40 km); indicates general trend only, not street-level concentration.',
      issuedAt: nowIso,
      licenseAttribution: CAMS_LICENSE_TEXT,
      isDemoFixture: false,
    });
  }

  return { ok: true, slots, city: detectedCity };
}
