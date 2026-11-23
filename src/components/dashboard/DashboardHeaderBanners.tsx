import { AlertTriangle, FileDown, Info, TrendingDown, TrendingUp } from 'lucide-react';
import type { HouseholdProfile, LanguageCode, ProtectionPlanResult } from '../../shared/types';
import { t } from '../../i18n/translations';
import { getGreetingKey } from './dashboardHelpers';

interface DashboardHeaderBarProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  plan: ProtectionPlanResult;
  dateFormatted: string;
  savingSnapshot: boolean;
  savedNotice: boolean;
  exportingPdf: boolean;
  onSaveSnapshot: () => void;
  onExportPdf: () => void;
}

export function DashboardHeaderBar({
  lang,
  household,
  plan,
  dateFormatted,
  savingSnapshot,
  savedNotice,
  exportingPdf,
  onSaveSnapshot,
  onExportPdf,
}: DashboardHeaderBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-[#565F58]">
          {t(lang, getGreetingKey())}, {household.name} · {plan.city}
          {household.locality ? ` (${household.locality})` : ''} · {dateFormatted}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-[#252D28]">
          {t(lang, 'dash_title')}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <button
          type="button"
          disabled={savingSnapshot}
          onClick={onSaveSnapshot}
          className="px-3.5 py-2 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
        >
          {savingSnapshot
            ? 'Saving…'
            : savedNotice
              ? t(lang, 'dash_savedNotice')
              : t(lang, 'action_persistPlan')}
        </button>
        <button
          type="button"
          disabled={exportingPdf}
          onClick={onExportPdf}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>{t(lang, 'action_downloadPdf')}</span>
        </button>
      </div>
    </div>
  );
}

export function DashboardNoticeBanners({
  lang,
  plan,
}: {
  lang: LanguageCode;
  plan: ProtectionPlanResult;
}) {
  if (
    !plan.isDemoFixture &&
    !(plan.conflictWarningKey && plan.conflictDetails) &&
    !plan.historicalTrend
  ) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {plan.isDemoFixture && (
        <div className="px-4 py-2.5 rounded-xl border border-[#E2E7E1] bg-gradient-to-r from-[#DCE9DD]/45 to-white flex items-center gap-2.5 text-xs text-[#252D28]">
          <Info className="w-4 h-4 text-[#263C32] shrink-0" />
          <span>{t(lang, 'demo_fixture_notice')}</span>
        </div>
      )}
      {plan.conflictWarningKey && plan.conflictDetails && (
        <div className="px-4 py-2.5 rounded-xl border border-[#B33A2E]/30 bg-white flex items-center gap-2.5 text-xs text-[#252D28]">
          <AlertTriangle className="w-4 h-4 text-[#B33A2E] shrink-0" />
          <span>
            <strong className="font-semibold text-[#B33A2E]">
              {t(lang, 'rec_conflict_title')}:
            </strong>{' '}
            <span className="text-[#565F58]">{plan.conflictDetails}</span>
          </span>
        </div>
      )}
      {plan.historicalTrend && (
        <div className="px-4 py-2.5 rounded-xl border border-[#E2E7E1] bg-white flex items-center justify-between gap-2 text-xs text-[#252D28]">
          <span className="inline-flex items-center gap-2 font-medium">
            {plan.historicalTrend.direction === 'worsening' ? (
              <TrendingUp className="w-4 h-4 text-[#B4691E]" />
            ) : (
              <TrendingDown className="w-4 h-4 text-[#3B6E52]" />
            )}
            <span>
              {t(lang, 'ui_historical_trend_label')}:{' '}
              <strong>{t(lang, `trend_${plan.historicalTrend.direction}`)}</strong>
            </span>
          </span>
          <span className="font-mono text-[11px] text-[#565F58] tabular-nums">
            {plan.historicalTrend.previousPm25 ?? '—'} → {plan.historicalTrend.latestPm25 ?? '—'}{' '}
            µg/m³ ({plan.historicalTrend.sampleCount})
          </span>
        </div>
      )}
    </div>
  );
}
