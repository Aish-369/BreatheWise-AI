import { motion } from 'motion/react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

export interface ComparisonMetricRow {
  label: string;
  valA: number | undefined;
  valB: number | undefined;
  max: number;
}

export function MetricComparisonGrid({
  lang,
  metrics,
}: {
  lang: LanguageCode;
  metrics: ComparisonMetricRow[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-2"
        >
          <div className="flex justify-between text-xs font-medium text-[#252D28]">
            <span>{m.label}</span>
            <span className="font-mono tabular-nums text-[#565F58]">
              {m.valA ?? '—'} vs {m.valB ?? t(lang, 'ui_not_reported')}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-white overflow-hidden">
              {typeof m.valA === 'number' && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: Math.min(1, m.valA / m.max) }}
                  transition={{ duration: 0.45 }}
                  style={{ originX: 0 }}
                  className="h-full rounded-full bg-[#263C32]"
                />
              )}
            </div>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              {typeof m.valB === 'number' ? (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: Math.min(1, m.valB / m.max) }}
                  transition={{ duration: 0.45 }}
                  style={{ originX: 0 }}
                  className="h-full rounded-full bg-[#829C83]"
                />
              ) : (
                <div className="h-full w-full border border-dashed border-[#E2E7E1] rounded-full" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
