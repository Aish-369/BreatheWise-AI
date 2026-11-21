import { useState } from 'react';
import { motion } from 'motion/react';
import type { LanguageCode, Pollutants } from '../shared/types';
import { t } from '../i18n/translations';

interface PollutantBreakdownChartProps {
  pollutants: Pollutants;
  locationLabel: string;
  lang: LanguageCode;
  onInspectStation?: () => void;
}

interface PollutantSpec {
  key: keyof Pollutants;
  label: string;
  unit: string;
  safeLimit: number;
  maxScale: number;
}

const SPECS: PollutantSpec[] = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', safeLimit: 60, maxScale: 180 },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', safeLimit: 100, maxScale: 300 },
  { key: 'no2', label: 'NO2', unit: 'µg/m³', safeLimit: 80, maxScale: 200 },
  { key: 'o3', label: 'O3', unit: 'µg/m³', safeLimit: 100, maxScale: 200 },
  { key: 'so2', label: 'SO2', unit: 'µg/m³', safeLimit: 80, maxScale: 200 },
  { key: 'co', label: 'CO', unit: 'mg/m³', safeLimit: 2.0, maxScale: 6.0 },
];

export function PollutantBreakdownChart({
  pollutants,
  locationLabel,
  lang,
  onInspectStation,
}: PollutantBreakdownChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div className="bg-white border border-[#E2E7E1] rounded-xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#252D28]">
              {t(lang, 'ui_pollutant_index_title')}
            </h2>
            <p className="mt-0.5 text-xs text-[#89918A]">{locationLabel}</p>
          </div>
          {onInspectStation && (
            <button
              type="button"
              onClick={onInspectStation}
              className="text-xs font-medium text-[#263C32] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t(lang, 'tab_telemetry')}
            </button>
          )}
        </div>

        <div className="mt-5 space-y-3.5">
          {SPECS.map((spec) => {
            const val = pollutants[spec.key];
            const hasValue = typeof val === 'number';
            const ratio = hasValue ? Math.min(1, val / spec.maxScale) : 0;
            const safeRatio = Math.min(1, spec.safeLimit / spec.maxScale);
            const exceedsSafe = hasValue && val > spec.safeLimit;
            const isHovered = hoveredKey === spec.key;

            return (
              <div
                key={spec.key}
                onMouseEnter={() => setHoveredKey(spec.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className="group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-[#252D28] w-11">{spec.label}</span>
                    <span className="text-[11px] text-[#89918A]">
                      {isHovered ? `CPCB 24h ref: ${spec.safeLimit} ${spec.unit}` : ''}
                    </span>
                  </div>
                  {hasValue ? (
                    <span
                      className={`font-mono tabular-nums font-medium ${
                        exceedsSafe ? 'text-[#B4691E]' : 'text-[#252D28]'
                      }`}
                    >
                      {val} <span className="text-[11px] text-[#89918A] font-normal">{spec.unit}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#89918A] italic">
                      {t(lang, 'ui_not_reported')}
                    </span>
                  )}
                </div>

                <div className="relative h-2.5 w-full rounded-full bg-[#F7F7F1] border border-[#E2E7E1]/70 overflow-hidden">
                  {hasValue && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.max(0.04, ratio) }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      style={{ originX: 0 }}
                      className={`h-full rounded-full ${
                        exceedsSafe
                          ? 'bg-gradient-to-r from-[#D99B38] to-[#C96438]'
                          : 'bg-gradient-to-r from-[#829C83] to-[#263C32]'
                      }`}
                    />
                  )}
                  <div
                    style={{ left: `${safeRatio * 100}%` }}
                    title={`CPCB Benchmark: ${spec.safeLimit} ${spec.unit}`}
                    className="absolute top-0 bottom-0 w-[1.5px] bg-[#252D28]/35"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-5 pt-3.5 border-t border-[#E2E7E1] text-[11px] text-[#89918A]">
        Vertical hairline marks India CPCB 24h/8h reference threshold. Missing sensors remain blank.
      </p>
    </div>
  );
}
