import { ShieldCheck } from 'lucide-react';
import type { LanguageCode, ProtectionPlanResult } from '../../shared/types';
import { t } from '../../i18n/translations';

interface DashboardSummaryCardProps {
  lang: LanguageCode;
  plan: ProtectionPlanResult;
  onNavigate: (tab: string) => void;
}

export function DashboardSummaryCard({ lang, plan, onNavigate }: DashboardSummaryCardProps) {
  const proceedCount = plan.dailyPlan.filter((i) => i.status === 'proceed_as_planned').length;
  const precautionCount = plan.dailyPlan.filter(
    (i) => i.status === 'proceed_with_precautions'
  ).length;
  const shiftCount = plan.dailyPlan.filter(
    (i) => i.status === 'adjust_window' || i.status === 'move_indoors'
  ).length;
  const holdCount = plan.dailyPlan.filter((i) => i.status === 'hold_pending_data').length;

  return (
    <div
      aria-live="polite"
      className="lg:col-span-5 rounded-2xl border border-[#E2E7E1] bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-[#DCE9DD]/45 p-6 lg:p-7 shadow-[0_1px_3px_rgba(37,45,40,0.04)] flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            {t(lang, 'dash_summary_heading')}
          </h2>
          <ShieldCheck className="w-4 h-4 text-[#263C32]" />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#252D28]">
          {t(lang, plan.summaryKey, plan.summaryParams)}
        </p>

        <div className="mt-5 grid grid-cols-2 xl:grid-cols-4 gap-2.5">
          <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3">
            <p className="font-mono text-xl font-bold text-[#3B6E52] tabular-nums">
              {proceedCount}
            </p>
            <p className="mt-0.5 text-[11px] text-[#525C56] leading-tight">
              {t(lang, 'ui_outdoor_ready')}
            </p>
          </div>
          <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3">
            <p className="font-mono text-xl font-bold text-[#8E5312] tabular-nums">
              {precautionCount}
            </p>
            <p className="mt-0.5 text-[11px] text-[#89918A] leading-tight">
              {t(lang, 'ui_precautions_count')}
            </p>
          </div>
          <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3">
            <p className="font-mono text-xl font-bold text-[#263C32] tabular-nums">{shiftCount}</p>
            <p className="mt-0.5 text-[11px] text-[#89918A] leading-tight">
              {t(lang, 'ui_shift_count')}
            </p>
          </div>
          <div className="rounded-xl bg-[#F6DFDC]/45 border border-[#E2E7E1] p-3">
            <p className="font-mono text-xl font-bold text-[#9A2E24] tabular-nums">{holdCount}</p>
            <p className="mt-0.5 text-[11px] text-[#89918A] leading-tight">
              {t(lang, 'ui_hold_pending_data')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#E2E7E1] flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => onNavigate('air-quality-indoor')}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E7E1] font-medium text-[#252D28] hover:bg-[#DCE9DD]/50 transition-colors cursor-pointer"
        >
          {t(lang, 'tab_indoor')}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('simulator')}
          className="px-3 py-1.5 rounded-lg bg-[#263C32] text-white font-medium hover:bg-[#1C2D25] transition-colors cursor-pointer"
        >
          {t(lang, 'side_simulator')}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('settings-trust')}
          className="text-xs font-medium text-[#89918A] hover:text-[#252D28] underline underline-offset-4 cursor-pointer"
        >
          {t(lang, 'tab_methodology')}
        </button>
      </div>
    </div>
  );
}
