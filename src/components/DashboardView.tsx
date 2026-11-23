import { useCallback, useMemo, useState } from 'react';
import type {
  EnvironmentalSnapshot,
  FamilyMember,
  ForecastSlot,
  HouseholdProfile,
  LanguageCode,
  ProtectionPlanResult,
} from '../shared/types';
import { PollutantBreakdownChart } from './PollutantBreakdownChart';
import { ForecastTrendChart } from './ForecastTrendChart';
import { DashboardHeaderBar, DashboardNoticeBanners } from './dashboard/DashboardHeaderBanners';
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

function formatDashboardDate(lang: LanguageCode): string {
  const locale = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
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
  const dateFormatted = useMemo(() => formatDashboardDate(lang), [lang]);

  const handleExportPdf = useCallback(async () => {
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
  }, [household, plan, lang]);

  const handleSaveSnapshot = useCallback(async () => {
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
  }, [onSaveSnapshot]);

  return (
    <div className="space-y-7">
      <DashboardHeaderBar
        lang={lang}
        household={household}
        plan={plan}
        dateFormatted={dateFormatted}
        savingSnapshot={savingSnapshot}
        savedNotice={savedNotice}
        exportingPdf={exportingPdf}
        onSaveSnapshot={() => void handleSaveSnapshot()}
        onExportPdf={() => void handleExportPdf()}
      />
      {actionError && (
        <p
          role="alert"
          className="rounded-lg border border-[#B33A2E]/35 bg-white px-4 py-3 text-xs text-[#9A2E24]"
        >
          {actionError}
        </p>
      )}
      <DashboardNoticeBanners lang={lang} plan={plan} />
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
