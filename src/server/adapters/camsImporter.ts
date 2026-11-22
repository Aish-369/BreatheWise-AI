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
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/;

function hasFormulaInjection(value: string): boolean {
  return FORMULA_PREFIX_PATTERN.test(value.trim());
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidIssuedAt(value: string): boolean {
  return (
    ISO_TIMESTAMP_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) <= Date.now()
  );
}

function validateForecastDate(forecastDate: string, issuedAt: string): boolean {
  return isValidIsoDate(forecastDate) && forecastDate >= issuedAt.slice(0, 10);
}

export function parseCamsImport(rawText: string): {
  ok: boolean;
  slots?: ForecastSlot[];
  city?: string;
  error?: string;
} {
  const trimmed = rawText.trim();
  if (!trimmed) return { ok: false, error: 'Import payload is empty.' };

  if (trimmed.startsWith('{')) {
    try {
      const parsed = CamsImportPayloadSchema.safeParse(JSON.parse(trimmed));
      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        };
      }
      if (!isValidIssuedAt(parsed.data.issuedAt)) {
        return {
          ok: false,
          error: 'issuedAt must be a valid ISO-8601 timestamp with timezone and cannot be in the future.',
        };
      }
      if (hasFormulaInjection(parsed.data.city) || hasFormulaInjection(parsed.data.gridId)) {
        return { ok: false, error: 'Rejected unsafe formula prefix in city or gridId.' };
      }

      const canonicalCity = normalizeCityCanonicalName(parsed.data.city);
      const slots: ForecastSlot[] = [];
      for (const [index, slot] of parsed.data.slots.entries()) {
        if (!validateForecastDate(slot.forecastDate, parsed.data.issuedAt)) {
          return {
            ok: false,
            error: `Invalid forecastDate "${slot.forecastDate}". It must be a real YYYY-MM-DD date on or after the forecast issue date.`,
          };
        }
        const derived = deriveAqiFromPollutants({
          pm25: slot.expectedPm25,
          pm10: slot.expectedPm10 ?? null,
        });
        slots.push({
          id: `cams-${canonicalCity.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${slot.timeWindow}-${Date.now()}-${index}`,
          city: canonicalCity,
          timeWindow: slot.timeWindow,
          forecastDate: slot.forecastDate,
          expectedPm25: slot.expectedPm25,
          expectedPm10: slot.expectedPm10 ?? null,
          expectedAqiIndia: slot.expectedAqiIndia ?? derived.aqi,
          trend: slot.trend,
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
    } catch (error) {
      return { ok: false, error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Parse error'}` };
    }
  }

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    return {
      ok: false,
      error: 'CSV requires a header row and at least one forecast row.',
    };
  }

  const header = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
  const idx = (column: string) => header.indexOf(column);
  const requiredColumns = ['city', 'grid_id', 'issued_at', 'forecast_date', 'time_window', 'expected_pm25'];
  const missingColumns = requiredColumns.filter((column) => idx(column) < 0);
  if (missingColumns.length > 0) {
    return { ok: false, error: `CSV is missing required columns: ${missingColumns.join(', ')}.` };
  }

  const slots: ForecastSlot[] = [];
  let detectedCity = '';

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    const columns = lines[rowIndex].split(',').map((cell) => cell.trim());
    for (const cell of columns) {
      if (cell && hasFormulaInjection(cell)) {
        return { ok: false, error: `Row ${rowIndex + 1}: unsafe formula prefix detected.` };
      }
    }

    const rawCity = columns[idx('city')] ?? '';
    const gridId = columns[idx('grid_id')] ?? '';
    const issuedAt = columns[idx('issued_at')] ?? '';
    if (!rawCity || rawCity.length > 60 || !gridId || gridId.length > 100) {
      return { ok: false, error: `Row ${rowIndex + 1}: valid city and grid_id are required.` };
    }
    if (!isValidIssuedAt(issuedAt)) {
      return { ok: false, error: `Row ${rowIndex + 1}: issued_at must be a valid past ISO-8601 timestamp with timezone.` };
    }

    const city = normalizeCityCanonicalName(rawCity);
    if (detectedCity && city !== detectedCity) {
      return { ok: false, error: 'A single CAMS import file must contain forecasts for one city only.' };
    }
    detectedCity = city;

    const forecastDate = columns[idx('forecast_date')] ?? '';
    if (!validateForecastDate(forecastDate, issuedAt)) {
      return {
        ok: false,
        error: `Row ${rowIndex + 1}: forecast_date must be a real YYYY-MM-DD date on or after issued_at.`,
      };
    }

    const timeWindow = columns[idx('time_window')] as TimeWindow;
    if (!VALID_WINDOWS.has(timeWindow)) {
      return {
        ok: false,
        error: `Row ${rowIndex + 1}: invalid time_window. Expected one of ${Array.from(VALID_WINDOWS).join(', ')}.`,
      };
    }

    const pm25Raw = columns[idx('expected_pm25')] ?? '';
    const pm25 = Number(pm25Raw);
    if (!pm25Raw || !Number.isFinite(pm25) || pm25 < 0 || pm25 > 2000) {
      return { ok: false, error: `Row ${rowIndex + 1}: invalid expected_pm25 value.` };
    }

    let pm10: number | null = null;
    if (idx('expected_pm10') >= 0 && (columns[idx('expected_pm10')] ?? '') !== '') {
      const pm10Raw = Number(columns[idx('expected_pm10')]);
      if (!Number.isFinite(pm10Raw) || pm10Raw < 0 || pm10Raw > 3000) {
        return { ok: false, error: `Row ${rowIndex + 1}: invalid expected_pm10 value.` };
      }
      pm10 = pm10Raw;
    }

    const trendRaw = idx('trend') >= 0 ? columns[idx('trend')] : '';
    const trend =
      trendRaw === 'improving' || trendRaw === 'worsening' || trendRaw === 'stable'
        ? trendRaw
        : 'unknown';
    const derived = deriveAqiFromPollutants({ pm25, pm10 });

    slots.push({
      id: `cams-csv-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timeWindow}-${Date.now()}-${rowIndex}`,
      city,
      timeWindow,
      forecastDate,
      expectedPm25: pm25,
      expectedPm10: pm10,
      expectedAqiIndia: derived.aqi,
      trend,
      dataType: 'forecast',
      providerLabel: `Copernicus CAMS (${gridId})`,
      gridResolutionNote:
        'Coarse regional atmospheric model grid (~40 km); indicates general trend only, not street-level concentration.',
      issuedAt,
      licenseAttribution: CAMS_LICENSE_TEXT,
      isDemoFixture: false,
    });
  }

  return { ok: true, slots, city: detectedCity };
}
