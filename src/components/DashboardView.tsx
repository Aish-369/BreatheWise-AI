import { useState } from 'react';
import { AlertTriangle, FileDown, Info, TrendingDown, TrendingUp } from 'lucide-react';
import type {
  EnvironmentalSnapshot,
  FamilyMember,
  ForecastSlot,
  HouseholdProfile,
  LanguageCode,
  ProtectionPlanResult,
} from '../shared/types';
import { t } from '../i18n/translations';
import { PollutantBreakdownChart } from './PollutantBreakdownChart';
import { ForecastTrendChart } from './ForecastTrendChart';
import { getGreetingKey } from './dashboard/dashboardHelpers';
import { DashboardHeroCard } from './dashboard/DashboardHeroCard';
import { DashboardSummaryCard } from './dashboard/DashboardSummaryCard';
import { FamilyMemberCards } from './dashboard/FamilyMemberCards';
import { DashboardTimelineCard } from './dashboard/DashboardTimelineCard';
import { RecommendationsList } from './dashboard/RecommendationsList';

interface DashboardViewProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  members: FamilyMember[];
  plan: ProtectionPlanResult;
  primarySnapshot: EnvironmentalSnapshot;
  forecasts: ForecastSlot[];
  onNavigate: (tab: string) => void;
  onSaveSnapshot: () => void;
}

export function DashboardView({
  lang,
  household,
  members,
  plan,
  primarySnapshot,
  forecasts,
  onNavigate,
  onSaveSnapshot,
}: DashboardViewProps) {
  const [expandedRecId, setExpandedRecId] = useState<string | null>(
    plan.recommendations[0]?.id ?? null
  );
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [savedNotice, setSavedNotice] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const dateFormatted = new Intl.DateTimeFormat(
    lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
    { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
  ).format(new Date());

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setActionError(null);
    try {
      const { exportProtectionPlanPdf } = await import('../utils/pdfExport');
      await exportProtectionPlanPdf(household, plan, lang);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to export the PDF report.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    setActionError(null);
    try {
      await onSaveSnapshot();
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save this protection plan.');
    } finally {
      setSavingSnapshot(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#89918A]">
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
            onClick={() => void handleSaveSnapshot()}
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
            onClick={() => void handleExportPdf()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{t(lang, 'action_downloadPdf')}</span>
          </button>
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-[#B33A2E]/35 bg-white px-4 py-3 text-xs text-[#9A2E24]"
        >
          {actionError}
        </p>
      )}

      {(plan.isDemoFixture ||
        (plan.conflictWarningKey && plan.conflictDetails) ||
        plan.historicalTrend) && (
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
                <span className="text-[#89918A]">{plan.conflictDetails}</span>
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
              <span className="font-mono text-[11px] text-[#89918A] tabular-nums">
                {plan.historicalTrend.previousPm25 ?? '—'} →{' '}
                {plan.historicalTrend.latestPm25 ?? '—'} µg/m³ ({plan.historicalTrend.sampleCount})
              </span>
            </div>
          )}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <DashboardHeroCard
          lang={lang}
          household={household}
          plan={plan}
          primarySnapshot={primarySnapshot}
        />
        <DashboardSummaryCard lang={lang} plan={plan} onNavigate={onNavigate} />
      </section>

      <FamilyMemberCards
        lang={lang}
        members={members}
        plan={plan}
        selectedMemberFilter={selectedMemberFilter}
        onSelectMember={setSelectedMemberFilter}
        onManageMembers={() => onNavigate('family')}
      />

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <PollutantBreakdownChart
            pollutants={primarySnapshot.pollutants}
            locationLabel={primarySnapshot.locationLabel}
            lang={lang}
            onInspectStation={() => onNavigate('air-quality')}
          />
        </div>
        <div className="lg:col-span-6 bg-white border border-[#E2E7E1] rounded-xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <ForecastTrendChart slots={forecasts} city={plan.city} lang={lang} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <DashboardTimelineCard
          lang={lang}
          dailyPlan={plan.dailyPlan}
          onOpenPlanner={() => onNavigate('planner')}
        />
        <RecommendationsList
          lang={lang}
          members={members}
          recommendations={plan.recommendations}
          selectedMemberFilter={selectedMemberFilter}
          expandedRecId={expandedRecId}
          onSelectMemberFilter={setSelectedMemberFilter}
          onToggleExpand={setExpandedRecId}
        />
      </div>
    </div>
  );
}
