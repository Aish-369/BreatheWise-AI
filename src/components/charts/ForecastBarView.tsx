import { motion } from 'motion/react';
import type { ForecastSlot } from '../../shared/types';

interface ForecastBarViewProps {
  valid: ForecastSlot[];
  maxPm: number;
  minPm: number;
  activeIndex: number;
  onSelectIndex: (idx: number) => void;
}

export function ForecastBarView({
  valid,
  maxPm,
  minPm,
  activeIndex,
  onSelectIndex,
}: ForecastBarViewProps) {
  return (
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
            onClick={() => onSelectIndex(idx)}
            onMouseEnter={() => onSelectIndex(idx)}
            aria-pressed={isSelected}
            aria-label={`${slot.timeWindow}: PM2.5 ~${val} µg/m³`}
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
            <span className="font-mono text-[10px] text-[#565F58] tabular-nums whitespace-nowrap">
              {slot.timeWindow.slice(0, 5)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
