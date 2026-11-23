import { useState } from 'react';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import type { ForecastSlot, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import { ForecastTrendChart } from '../ForecastTrendChart';

interface CamsForecastTabProps {
  lang: LanguageCode;
  city: string;
  forecasts: ForecastSlot[];
  onImportCams: (rawText: string) => Promise<{ ok: boolean; message: string }>;
}

function CamsForecastSideColumn({
  lang,
  city,
  forecasts,
}: {
  lang: LanguageCode;
  city: string;
  forecasts: ForecastSlot[];
}) {
  return (
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
                  <span className="text-[#565F58]"> · {f.trend}</span>
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
  );
}

export function CamsForecastTab({ lang, city, forecasts, onImportCams }: CamsForecastTabProps) {
  const [camsText, setCamsText] = useState('');
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setImportStatus({ ok: false, message: 'File exceeds 512 KB limit.' });
      return;
    }
    const text = await file.text();
    setCamsText(text);
    setImportStatus(null);
    e.target.value = '';
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form
        onSubmit={(e) => void handleImport(e)}
        className="lg:col-span-6 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
      >
        <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#4D6B50]" strokeWidth={1.8} />
          <span>Copernicus CAMS Manual Importer (CSV / JSON)</span>
        </h2>
        <p className="text-xs text-[#565F58]">
          Paste exported CAMS coarse-grid forecast rows. Validated via Zod, sanitized against CSV
          formula injection, and attributed to CAMS.
        </p>
        <textarea
          aria-label="Copernicus CAMS CSV or JSON input"
          rows={7}
          value={camsText}
          onChange={(e) => setCamsText(e.target.value)}
          className="w-full p-3 font-mono text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-xl text-[#252D28]"
        />
        {importStatus && (
          <div
            role="status"
            aria-live="polite"
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
        <div className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] text-[11px] leading-relaxed text-[#252D28]">
          <p className="font-semibold text-[#263C32]">{t(lang, 'cams_mode_manual_title')}</p>
          <p className="mt-1 text-[#565F58]">{t(lang, 'cams_mode_manual_desc')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="submit"
            disabled={importing}
            className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
          >
            {t(lang, 'action_importCams')}
          </button>
          <label className="px-3.5 py-2 text-xs font-medium border border-[#E2E7E1] bg-[#F7F7F1] text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/40 cursor-pointer inline-flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-[#263C32]" />
            <span>{t(lang, 'cams_upload_file')}</span>
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={(e) => void handleFileUpload(e)}
              className="sr-only"
            />
          </label>
        </div>
      </form>

      <CamsForecastSideColumn lang={lang} city={city} forecasts={forecasts} />
    </div>
  );
}
