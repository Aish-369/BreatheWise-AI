import { ArrowRight, Bike, Clock, Home, Sun } from 'lucide-react';
import type { DailyPlanItem, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import { statusChipStyle } from './dashboardHelpers';

interface DashboardTimelineCardProps {
  lang: LanguageCode;
  dailyPlan: DailyPlanItem[];
  onOpenPlanner: () => void;
}

export function DashboardTimelineCard({
  lang,
  dailyPlan,
  onOpenPlanner,
}: DashboardTimelineCardProps) {
  return (
    <section className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">
          {t(lang, 'dash_planner_heading')}
        </h2>
        <button
          type="button"
          onClick={onOpenPlanner}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#263C32] hover:underline underline-offset-4 cursor-pointer"
        >
          <span>{t(lang, 'side_planner')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5">
        {dailyPlan.length === 0 ? (
          <p className="text-xs text-[#565F58]">{t(lang, 'ui_no_routines')}</p>
        ) : (
          <div className="relative pl-5 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[#E2E7E1]">
            {dailyPlan.map((item) => {
              const EnvIcon =
                item.environment === 'indoor' ? Home : item.suggestedWindow ? Sun : Bike;
              return (
                <div key={item.routineId} className="relative">
                  <span className="absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#263C32]" />
                  <div className="rounded-xl border border-[#E2E7E1] bg-[#F7F7F1]/55 p-3.5 space-y-2 hover:bg-white transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <EnvIcon className="w-3.5 h-3.5 text-[#263C32] shrink-0" />
                        <p className="text-sm font-medium text-[#252D28] leading-snug">
                          {item.routineTitle}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium shrink-0 whitespace-nowrap ${statusChipStyle(
                          item.status
                        )}`}
                      >
                        {t(lang, `status_${item.status}`)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#565F58]">
                      <span>
                        {t(lang, `env_${item.environment}`)} · {item.applicableMembers.join(', ')}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#252D28] tabular-nums">
                        <Clock className="w-3 h-3 text-[#4D6B50]" />
                        {item.suggestedWindow
                          ? `${item.originalWindow} → ${item.suggestedWindow}`
                          : item.originalWindow}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
