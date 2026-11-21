import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Radio, ShieldCheck, Upload } from 'lucide-react';
import type {
  AqiBand,
  EnvironmentalSnapshot,
  ForecastSlot,
  LanguageCode,
  ProviderAdapterStatus,
} from '../shared/types';
import { t } from '../i18n/translations';
import { deriveAqiFromPollutants } from '../engine/quality';
import { ForecastTrendChart } from './ForecastTrendChart';
import { IndoorGuidanceView } from './IndoorGuidanceView';

interface EnvironmentViewProps {
  lang: LanguageCode;
  city: string;
  currentBand: AqiBand;
  primarySnapshot: EnvironmentalSnapshot;
  secondarySnapshots: EnvironmentalSnapshot[];
  forecasts: ForecastSlot[];
  providerStatuses: ProviderAdapterStatus[];
  initialSubTab?: 'telemetry' | 'indoor' | 'forecast';
  onImportCams: (rawText: string) => Promise<{ ok: boolean; message: string }>;
}

const SAMPLE_CAMS_CSV = `city,grid_id,forecast_date,time_window,expected_pm25,expected_pm10,trend
Pune,CAMS-GLOBAL-0.4DEG,2026-11-21,06:00-09:00,74,130,worsening
Pune,CAMS-GLOBAL-0.4DEG,2026-11-21,09:00-12:00,58,112,improving
Pune,CAMS-GLOBAL-0.4DEG,2026-11-21,12:00-16:00,39,82,improving
Pune,CAMS-GLOBAL-0.4DEG,2026-11-21,16:00-19:00,54,104,stable
Pune,CAMS-GLOBAL-0.4DEG,2026-11-21,19:00-22:00,70,126,worsening`;

export function EnvironmentView({
  lang,
  city,
  currentBand,
  primarySnapshot,
  secondarySnapshots,
  forecasts,
  providerStatuses,
  initialSubTab = 'telemetry',
  onImportCams,
}: EnvironmentViewProps) {
  const [subTab, setSubTab] = useState<'telemetry' | 'indoor' | 'forecast'>(initialSubTab);
  const [camsText, setCamsText] = useState(SAMPLE_CAMS_CSV);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const allSnapshots = [primarySnapshot, ...secondarySnapshots];

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setImportStatus(null);
    try {
      const res = await onImportCams(camsText);
      setImportStatus(res);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'env_title')}</h1>
          <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'env_subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
          {(['telemetry', 'forecast', 'indoor'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === tab
                  ? 'bg-[#263C32] text-white'
                  : 'text-[#89918A] hover:text-[#252D28]'
              }`}
            >
              {tab === 'telemetry'
                ? t(lang, 'tab_telemetry')
                : tab === 'forecast'
                  ? t(lang, 'tab_forecast')
                  : t(lang, 'tab_indoor')}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'indoor' ? (
        <IndoorGuidanceView lang={lang} currentBand={currentBand} city={city} />
      ) : subTab === 'forecast' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleImport}
            className="lg:col-span-6 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
          >
            <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#829C83]" strokeWidth={1.8} />
              <span>Copernicus CAMS Manual Importer (CSV / JSON)</span>
            </h2>
            <p className="text-xs text-[#89918A]">
              Paste exported CAMS coarse-grid forecast rows. Validated via Zod and attributed to CAMS.
            </p>
            <textarea
              rows={7}
              value={camsText}
              onChange={(e) => setCamsText(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-xl text-[#252D28]"
            />
            {importStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  importStatus.ok
                    ? 'border-[#829C83]/50 bg-[#DCE9DD]/45 text-[#252D28]'
                    : 'border-[#B33A2E]/40 bg-white text-[#B33A2E]'
                }`}
              >
                {importStatus.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3B6E52] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#B33A2E] shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={importing}
                className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
              >
                {t(lang, 'action_importCams')}
              </button>
              <button
                type="button"
                onClick={() => setCamsText(SAMPLE_CAMS_CSV)}
                className="px-4 py-2 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/40 cursor-pointer"
              >
                Reset Sample CSV
              </button>
            </div>
          </form>

          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
              <ForecastTrendChart slots={forecasts} city={city} lang={lang} />
            </div>

            {forecasts.length > 0 && (
              <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
                <div className="divide-y divide-[#E2E7E1]">
                  {forecasts.map((f) => (
                    <div key={f.id} className="px-5 py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-medium text-[#252D28] tabular-nums">
                          {f.timeWindow}
                        </span>
                        <span className="text-[#89918A]"> · {f.trend}</span>
                      </div>
                      <span className="font-mono tabular-nums text-[#252D28]">
                        PM2.5 ~{f.expectedPm25 ?? '—'} µg/m³ · NAQI {f.expectedAqiIndia ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Station Divergence Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {allSnapshots.map((s) => {
              const derived = deriveAqiFromPollutants(s.pollutants, s.reportedAqiIndia);
              const barPct = derived.aqi ? Math.min(100, Math.round((derived.aqi / 300) * 100)) : 0;
              return (
                <div
                  key={s.id}
                  className="bg-white border border-[#E2E7E1] rounded-2xl p-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)] space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-[#89918A]">
                        {t(lang, `dtype_${s.dataType}`)}
                      </p>
                      <h2 className="mt-0.5 font-display text-base font-semibold text-[#252D28]">
                        {s.providerLabel}
                      </h2>
                      <p className="font-mono text-[11px] text-[#89918A]">{s.locationLabel}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-[#263C32] tabular-nums">
                        {derived.aqi ?? '—'}
                      </span>
                      <p className="text-[11px] text-[#89918A]">
                        {t(lang, `fresh_${s.freshness}`)}
                      </p>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[#F7F7F1] overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.max(0.05, barPct / 100) }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      style={{ originX: 0 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#829C83] to-[#263C32]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E7E1] text-xs font-mono tabular-nums">
                    <div>
                      <span className="block text-[10px] text-[#89918A]">PM2.5</span>
                      <span className="font-medium text-[#252D28]">
                        {s.pollutants.pm25 ?? '—'} µg/m³
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#89918A]">PM10</span>
                      <span className="font-medium text-[#252D28]">
                        {s.pollutants.pm10 ?? '—'} µg/m³
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#89918A]">NO2</span>
                      <span className="font-medium text-[#252D28]">
                        {s.pollutants.no2 ?? '—'} µg/m³
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Station Telemetry Ledger */}
          <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
            <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-[#252D28]">
                Environmental Evidence · {city}
              </h2>
              <span className="font-mono text-xs text-[#89918A] tabular-nums">
                {allSnapshots.length} source(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E7E1] text-[#89918A] bg-[#F7F7F1]/55">
                    <th className="py-2.5 px-5 font-medium">Source & Station</th>
                    <th className="py-2.5 px-4 font-medium">Classification</th>
                    <th className="py-2.5 px-4 font-medium text-right">PM2.5</th>
                    <th className="py-2.5 px-4 font-medium text-right">PM10</th>
                    <th className="py-2.5 px-4 font-medium text-right">NO2</th>
                    <th className="py-2.5 px-4 font-medium">Freshness</th>
                    <th className="py-2.5 px-5 font-medium">Measured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7E1]">
                  {allSnapshots.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F7F1]/70">
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-[#252D28]">{s.providerLabel}</p>
                        <p className="font-mono text-[11px] text-[#89918A]">
                          {s.stationOrGridId}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-[#252D28]">
                        {t(lang, `dtype_${s.dataType}`)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {typeof s.pollutants.pm25 === 'number' ? `${s.pollutants.pm25} µg/m³` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {typeof s.pollutants.pm10 === 'number' ? `${s.pollutants.pm10} µg/m³` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {typeof s.pollutants.no2 === 'number' ? `${s.pollutants.no2} µg/m³` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#263C32]">
                        {t(lang, `fresh_${s.freshness}`)}
                      </td>
                      <td className="py-3.5 px-5 font-mono tabular-nums text-[#89918A]">
                        {s.measuredAt ? new Date(s.measuredAt).toLocaleString() : 'Unavailable'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Provider Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {providerStatuses.map((p) => (
              <div
                key={p.provider}
                className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Radio className="w-4 h-4 text-[#263C32]" />
                    <span className="px-2 py-0.5 rounded-md bg-[#F7F7F1] text-[11px] font-medium text-[#252D28] capitalize">
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-sm font-semibold text-[#252D28]">{p.name}</h3>
                  <p className="mt-1 text-xs font-medium text-[#263C32]">{p.licenseName}</p>
                  <p className="mt-1.5 text-xs text-[#89918A]">{p.notes}</p>
                </div>
                <p className="mt-4 pt-3 border-t border-[#E2E7E1] text-[11px] text-[#89918A] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#829C83] shrink-0" />
                  <span className="truncate">{p.attributionText}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
