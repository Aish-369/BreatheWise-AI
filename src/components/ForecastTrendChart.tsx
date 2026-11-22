import { useState } from 'react';
import { motion } from 'motion/react';
import type { ForecastSlot, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';

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
          <p className="mt-2 text-xs text-[#89918A] leading-relaxed">
            {t(lang, 'ui_chart_pm25_no_forecast', { city })}
          </p>
        </div>
        <div className="mt-6 h-28 rounded-lg border border-dashed border-[#E2E7E1] bg-[#F7F7F1]/70 flex items-center justify-center text-xs text-[#89918A] px-3 text-center">
          {t(lang, 'ui_chart_import_cams_hint')}
        </div>
      </div>
    );
  }

  const maxPm = Math.max(90, ...valid.map((s) => s.expectedPm25 ?? 0));
  const minPm = Math.min(...valid.map((s) => s.expectedPm25 ?? 0));
  const activeSlot = valid[Math.min(activeIndex, valid.length - 1)];

  // SVG coordinate space for smooth curve
  const width = 420;
  const height = 140;
  const padX = 28;
  const padY = 20;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;

  const points = valid.map((slot, idx) => {
    const x =
      valid.length === 1 ? width / 2 : padX + (idx / (valid.length - 1)) * usableW;
    const val = slot.expectedPm25 ?? 0;
    const y = padY + usableH - (val / maxPm) * usableH;
    return { x, y, slot, val };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - padY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`
      : '';

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#252D28]">
            {t(lang, 'dash_expectedPm25Trend')}
          </h2>
          <p className="mt-0.5 text-xs text-[#89918A]">
            {valid[0].providerLabel} · <span className="font-mono">µg/m³ · {t(lang, 'dash_coarseGrid')}</span>
          </p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setChartType('curve')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartType === 'curve'
                ? 'bg-white text-[#252D28] shadow-xs'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'ui_curve_view')}
          </button>
          <button
            type="button"
            onClick={() => setChartType('bars')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              chartType === 'bars'
                ? 'bg-white text-[#252D28] shadow-xs'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'ui_bar_view')}
          </button>
        </div>
      </div>

      {/* Selected Slot Readout */}
      {activeSlot && (
        <div className="px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-[#DCE9DD]/55 to-[#F7F7F1] border border-[#E2E7E1] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-[#263C32] tabular-nums">
              {activeSlot.timeWindow}
            </span>
            <span className="text-[#89918A] capitalize">· {activeSlot.trend}</span>
          </div>
          <div className="font-mono tabular-nums text-[#252D28]">
            PM2.5 <strong>~{activeSlot.expectedPm25} µg/m³</strong>
            {activeSlot.expectedAqiIndia ? ` · NAQI ${activeSlot.expectedAqiIndia}` : ''}
          </div>
        </div>
      )}

      {chartType === 'curve' ? (
        <div className="pt-1">
          <svg
            viewBox={`0 0 ${width} ${height + 18}`}
            className="w-full h-40 overflow-visible"
            role="img"
            aria-label="Coarse-grid expected PM2.5 trend curve"
          >
            <defs>
              <linearGradient id="bwForecastArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#829C83" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#DCE9DD" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal guides */}
            {[0.25, 0.5, 0.75].map((r) => {
              const gy = padY + usableH * (1 - r);
              return (
                <line
                  key={r}
                  x1={padX}
                  x2={width - padX}
                  y1={gy}
                  y2={gy}
                  stroke="#E2E7E1"
                  strokeDasharray="3 3"
                />
              );
            })}

            {areaPath && <path d={areaPath} fill="url(#bwForecastArea)" />}

            {linePath && (
              <motion.path
                d={linePath}
                fill="none"
                stroke="#263C32"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0.2, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            )}

            {points.map((pt, idx) => {
              const isBest = pt.val === minPm;
              const isActive = idx === activeIndex;
              return (
                <g
                  key={pt.slot.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 6.5 : 4.5}
                    fill={isBest ? '#3B6E52' : '#263C32'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 11}
                    textAnchor="middle"
                    className="fill-[#252D28] font-mono text-[10px] font-medium tabular-nums"
                  >
                    {pt.val}
                  </text>
                  <text
                    x={pt.x}
                    y={height + 8}
                    textAnchor="middle"
                    className="fill-[#89918A] font-mono text-[10px] tabular-nums"
                  >
                    {pt.slot.timeWindow.slice(0, 5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3 items-end pt-3 border-t border-[#E2E7E1]">
          {valid.map((slot, idx) => {
            const val = slot.expectedPm25 ?? 0;
            const heightPx = Math.max(16, Math.round((val / maxPm) * 108));
            const isBest = val === minPm;
            const isSelected = idx === activeIndex;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <span className="font-mono text-[11px] font-medium text-[#252D28] tabular-nums">
                  {val}
                </span>
                <div
                  className={`w-full max-w-[46px] h-[112px] flex items-end justify-center rounded-md p-0.5 transition-colors ${
                    isSelected ? 'bg-[#DCE9DD]/60' : 'bg-[#F7F7F1]'
                  }`}
                >
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: `${heightPx}px`, originY: 1 }}
                    className={`w-full rounded ${
                      isBest
                        ? 'bg-gradient-to-t from-[#3B6E52] to-[#829C83]'
                        : 'bg-gradient-to-t from-[#263C32] to-[#4A6B5B]'
                    }`}
                  />
                </div>
                <span className="font-mono text-[10px] text-[#89918A] tabular-nums whitespace-nowrap">
                  {slot.timeWindow.slice(0, 5)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
