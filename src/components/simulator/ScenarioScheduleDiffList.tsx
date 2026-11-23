import type { LanguageCode, ScenarioComparisonResult } from '../../shared/types';
import { t } from '../../i18n/translations';

export function ScenarioScheduleDiffList({
  lang,
  result,
}: {
  lang: LanguageCode;
  result: ScenarioComparisonResult;
}) {
  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-[#252D28]">Resulting Schedule</h3>
        <span className="font-mono text-xs text-[#565F58] tabular-nums">
          {result.changedScheduleCount} shifted
        </span>
      </div>
      <div className="divide-y divide-[#E2E7E1]">
        {result.scenarioPlan.dailyPlan.map((item) => {
          const baseItem = result.baselinePlan.dailyPlan.find(
            (b) => b.routineId === item.routineId
          );
          const changed =
            !baseItem ||
            baseItem.status !== item.status ||
            baseItem.suggestedWindow !== item.suggestedWindow;
          return (
            <div
              key={item.routineId}
              className={`px-6 py-4 flex items-start justify-between gap-4 ${
                changed ? 'bg-[#DCE9DD]/25' : ''
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-[#252D28]">
                  {item.routineTitle}
                  {changed && (
                    <span className="ml-2 text-xs font-medium text-[#263C32]">(Changed)</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-[#565F58]">
                  {t(lang, item.rationaleKey, item.rationaleParams)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-[#263C32]">
                  {t(lang, `status_${item.status}`)}
                </p>
                {item.suggestedWindow && (
                  <p className="font-mono text-xs text-[#3B6E52] tabular-nums">
                    → {item.suggestedWindow}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
