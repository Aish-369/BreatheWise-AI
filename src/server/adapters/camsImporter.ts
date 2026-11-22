import {
  CamsImportPayloadSchema,
  type ForecastSlot,
  type ProviderAdapterStatus,
  type TimeWindow,
} from '../../shared/types';
import { normalizeCityCanonicalName } from '../../shared/indianCities';
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

const FORMULA_PREFIX_PATTERN = /^[=+\-@\t\r]/;

function hasFormulaInjection(value: string): boolean {
  return FORMULA_PREFIX_PATTERN.test(value.trim());
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
      if (hasFormulaInjection(parsed.data.city) || hasFormulaInjection(parsed.data.gridId)) {
        return {
          ok: false,
          error: 'Rejected unsafe formula prefix in city or gridId.',
        };
      }
      const canonicalCity = normalizeCityCanonicalName(parsed.data.city);
      const slots: ForecastSlot[] = [];
      for (const s of parsed.data.slots) {
        if (!ISO_DATE_PATTERN.test(s.forecastDate)) {
          return {
            ok: false,
            error: `Invalid forecastDate "${s.forecastDate}". Expected YYYY-MM-DD.`,
          };
        }
        const derived = deriveAqiFromPollutants({
          pm25: s.expectedPm25,
          pm10: s.expectedPm10 ?? null,
        });
        slots.push({
          id: `cams-${canonicalCity.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${s.timeWindow}-${Date.now()}`,
          city: canonicalCity,
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
        });
      }
      return { ok: true, slots, city: canonicalCity };
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
    for (const cell of cols) {
      if (cell && hasFormulaInjection(cell)) {
        return {
          ok: false,
          error: `Row ${i + 1}: unsafe formula prefix detected in cell "${cell}".`,
        };
      }
    }

    const rawCity = cols[idx('city')] || 'Pune';
    if (rawCity.length > 60) {
      return { ok: false, error: `Row ${i + 1}: city name exceeds 60 characters.` };
    }
    const city = normalizeCityCanonicalName(rawCity);
    detectedCity = city;

    const gridId = idx('grid_id') >= 0 ? cols[idx('grid_id')] || 'CAMS-GLOBAL-0.4DEG' : 'CAMS-GLOBAL-0.4DEG';
    const forecastDate =
      idx('forecast_date') >= 0 ? cols[idx('forecast_date')] || nowIso.slice(0, 10) : nowIso.slice(0, 10);
    if (!ISO_DATE_PATTERN.test(forecastDate)) {
      return {
        ok: false,
        error: `Row ${i + 1}: invalid forecast_date "${forecastDate}". Expected YYYY-MM-DD.`,
      };
    }

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
    let pm10: number | null = null;
    if (idx('expected_pm10') >= 0 && cols[idx('expected_pm10')] !== '') {
      const pm10Raw = Number(cols[idx('expected_pm10')]);
      if (!Number.isFinite(pm10Raw) || pm10Raw < 0 || pm10Raw > 3000) {
        return { ok: false, error: `Row ${i + 1}: invalid expected_pm10 value.` };
      }
      pm10 = pm10Raw;
    }
    const trendRaw = idx('trend') >= 0 ? cols[idx('trend')] : 'stable';
    const trend =
      trendRaw === 'improving' || trendRaw === 'worsening' || trendRaw === 'stable'
        ? trendRaw
        : 'stable';

    const derived = deriveAqiFromPollutants({ pm25, pm10 });
    slots.push({
      id: `cams-csv-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${tw}-${Date.now()}-${i}`,
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
