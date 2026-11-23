import { useState } from 'react';
import type { ForecastSlot, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';
import { ForecastCurveSvg } from './charts/ForecastCurveSvg';
import { ForecastBarView } from './charts/ForecastBarView';

interface ForecastTrendChartProps {
  slots: ForecastSlot[];
  city: string;
  lang?: LanguageCode;
}

export function ForecastTrendChart({ slots, city, lang = 'en' }: ForecastTrendChartProps) {
  const valid = slots.filter((s) => typeof s.expectedPm25 === 'number');
  const [chartType, setChartType] = useState<'curve' | 'bars'>('curve');
  const [activeIndex, setActiveIndex] = useState<number>(
    valid.length > 0
      ? valid.reduce(
          (bestIdx, slot, idx, arr) =>
            (slot.expectedPm25 ?? 999) < (arr[bestIdx].expectedPm25 ?? 999) ? idx : bestIdx,
          0
        )
      : 0
  );

  if (valid.length === 0) {
    return (
      <div className="h-full flex flex-col justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#252D28]">
            {t(lang, 'dash_expectedPm25Trend')} · {city}
          </h2>
          <p className="mt-2 text-xs text-[#565F58] leading-relaxed">
            {t(lang, 'ui_chart_pm25_no_forecast', { city })}
          </p>
        </div>
        <div className="mt-6 h-28 rounded-lg border border-dashed border-[#E2E7E1] bg-[#F7F7F1]/70 flex items-center justify-center text-xs text-[#565F58] px-3 text-center">
          {t(lang, 'ui_chart_import_cams_hint')}
        </div>
      </div>
    );
  }

  const maxPm = Math.max(90, ...valid.map((s) => s.expectedPm25 ?? 0));
  const minPm = Math.min(...valid.map((s) => s.expectedPm25 ?? 0));
  const activeSlot = valid[Math.min(activeIndex, valid.length - 1)];

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#252D28]">
            {t(lang, 'dash_expectedPm25Trend')}
          </h2>
          <p className="mt-0.5 text-xs text-[#565F58]">
            {valid[0].providerLabel} ·{' '}
            <span className="font-mono">µg/m³ · {t(lang, 'dash_coarseGrid')}</span>
          </p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setChartType('curve')}
            aria-pressed={chartType === 'curve'}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartType === 'curve'
                ? 'bg-white text-[#252D28] shadow-xs'
                : 'text-[#565F58] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'ui_curve_view')}
          </button>
          <button
            type="button"
            onClick={() => setChartType('bars')}
            aria-pressed={chartType === 'bars'}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartType === 'bars'
                ? 'bg-white text-[#252D28] shadow-xs'
                : 'text-[#565F58] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'ui_bar_view')}
          </button>
        </div>
      </div>

      {activeSlot && (
        <div
          aria-live="polite"
          className="px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-[#DCE9DD]/55 to-[#F7F7F1] border border-[#E2E7E1] flex flex-wrap items-center justify-between gap-2 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-[#263C32] tabular-nums">
              {activeSlot.timeWindow}
            </span>
            <span className="text-[#565F58] capitalize">· {activeSlot.trend}</span>
          </div>
          <div className="font-mono tabular-nums text-[#252D28]">
            PM2.5 <strong>~{activeSlot.expectedPm25} µg/m³</strong>
            {activeSlot.expectedAqiIndia != null ? ` · NAQI ${activeSlot.expectedAqiIndia}` : ''}
          </div>
        </div>
      )}

      {chartType === 'curve' ? (
        <ForecastCurveSvg
          valid={valid}
          maxPm={maxPm}
          minPm={minPm}
          activeIndex={activeIndex}
          onSelectIndex={setActiveIndex}
        />
      ) : (
        <ForecastBarView
          valid={valid}
          maxPm={maxPm}
          minPm={minPm}
          activeIndex={activeIndex}
          onSelectIndex={setActiveIndex}
        />
      )}
    </div>
  );
}
