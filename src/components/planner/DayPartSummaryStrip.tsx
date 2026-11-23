import type { DailyPlanItem, ForecastSlot, LanguageCode, TimeWindow } from '../../shared/types';
import { t } from '../../i18n/translations';
import { TIME_WINDOWS } from './plannerFormReducer';

interface DayPartSummaryStripProps {
  lang: LanguageCode;
  dailyPlan: DailyPlanItem[];
  forecasts: ForecastSlot[];
}

const DAY_PARTS = [
  { key: 'ui_part_morning', windows: ['06:00-09:00', '09:00-12:00'] as TimeWindow[] },
  { key: 'ui_part_afternoon', windows: ['12:00-16:00'] as TimeWindow[] },
  { key: 'ui_part_evening', windows: ['16:00-19:00', '19:00-22:00'] as TimeWindow[] },
];

export function DayPartSummaryStrip({ lang, dailyPlan, forecasts }: DayPartSummaryStripProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {DAY_PARTS.map((part) => {
          const partItems = dailyPlan.filter((item) =>
            part.windows.includes(item.suggestedWindow ?? item.originalWindow)
          );
          const partForecasts = forecasts.filter(
            (f) =>
              part.windows.includes(f.timeWindow) &&
              typeof f.expectedPm25 === 'number' &&
              Number.isFinite(f.expectedPm25)
          );
          const avgPm =
            partForecasts.length > 0
              ? Math.round(
                  partForecasts.reduce((acc, f) => acc + f.expectedPm25!, 0) / partForecasts.length
                )
              : null;
          return (
            <div
              key={part.key}
              className="rounded-xl bg-gradient-to-br from-white to-[#DCE9DD]/30 border border-[#E2E7E1] p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-xs font-semibold text-[#252D28]">{t(lang, part.key)}</p>
                <p className="mt-0.5 text-[11px] text-[#565F58]">
                  {partItems.length} routine(s)
                  {avgPm !== null ? ` · Est. PM2.5 ~${avgPm} µg/m³` : ''}
                </p>
              </div>
              <span className="font-mono text-lg font-bold text-[#263C32] tabular-nums">
                {partItems.length}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TIME_WINDOWS.map((win) => {
          const itemsInWindow = dailyPlan.filter(
            (i) => (i.suggestedWindow ?? i.originalWindow) === win
          );
          const forecastMatch = forecasts.find((f) => f.timeWindow === win);
          return (
            <div
              key={win}
              className="bg-white border border-[#E2E7E1] rounded-xl p-3.5 shadow-[0_1px_3px_rgba(37,45,40,0.03)]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#252D28] tabular-nums">{win}</span>
                <span className="font-mono text-[11px] text-[#565F58] tabular-nums">
                  {itemsInWindow.length}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#565F58]">
                {typeof forecastMatch?.expectedPm25 === 'number'
                  ? `Est. PM2.5 ~${forecastMatch.expectedPm25} µg/m³`
                  : 'No PM2.5 forecast for this window'}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
