import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Baby,
  Bike,
  ChevronDown,
  ChevronUp,
  Clock,
  FileDown,
  Footprints,
  GraduationCap,
  Home,
  Info,
  ShieldCheck,
  Sparkles,
  Sun,
  TreePine,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react';
import type {
  EnvironmentalSnapshot,
  FamilyMember,
  ForecastSlot,
  HouseholdProfile,
  LanguageCode,
  ProtectionPlanResult,
} from '../shared/types';
import { t } from '../i18n/translations';
import { AqiGauge } from './AqiGauge';
import { PollutantBreakdownChart } from './PollutantBreakdownChart';
import { ForecastTrendChart } from './ForecastTrendChart';

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

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'greet_morning';
  if (hour < 17) return 'greet_afternoon';
  return 'greet_evening';
}

function bandIndexPercent(aqi: number | null): number {
  if (aqi === null) return 0;
  return Math.max(2, Math.min(98, (aqi / 450) * 100));
}

function memberAgeIcon(ageGroup: FamilyMember['ageGroup']) {
  switch (ageGroup) {
    case 'infant_toddler':
      return Baby;
    case 'school_child':
      return GraduationCap;
    case 'older_adult':
      return Footprints;
    default:
      return User;
  }
}

function severityDotColor(severity: string): string {
  switch (severity) {
    case 'elevated':
    case 'unavailable':
      return 'text-[#B33A2E] bg-[#B33A2E]/10';
    case 'caution':
    case 'advisory':
      return 'text-[#B4691E] bg-[#B4691E]/10';
    default:
      return 'text-[#3B6E52] bg-[#DCE9DD]';
  }
}

function statusChipStyle(status: string): string {
  switch (status) {
    case 'proceed_as_planned':
      return 'bg-[#DCE9DD]/70 text-[#263C32]';
    case 'adjust_window':
      return 'bg-[#263C32] text-white';
    case 'proceed_with_precautions':
      return 'bg-[#F5EBD8] text-[#8E5312]';
    case 'move_indoors':
    case 'hold_pending_data':
      return 'bg-[#F6DFDC] text-[#9A2E24]';
    default:
      return 'bg-[#F7F7F1] text-[#252D28]';
  }
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

  const dateFormatted = new Intl.DateTimeFormat(
    lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN',
    { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
  ).format(new Date());

  const proceedCount = plan.dailyPlan.filter((i) => i.status === 'proceed_as_planned').length;
  const precautionCount = plan.dailyPlan.filter(
    (i) => i.status === 'proceed_with_precautions'
  ).length;
  const shiftCount = plan.dailyPlan.filter(
    (i) => i.status === 'adjust_window' || i.status === 'move_indoors'
  ).length;

  const filteredRecommendations =
    selectedMemberFilter === 'all'
      ? plan.recommendations
      : plan.recommendations.filter((r) => r.applicableMembers.includes(selectedMemberFilter));

  const getMemberStatus = (member: FamilyMember): { label: string; tone: string } => {
    const memberItems = plan.dailyPlan.filter((d) => d.applicableMembers.includes(member.name));
    if (memberItems.some((d) => d.status === 'adjust_window' || d.status === 'move_indoors')) {
      return {
        label: t(lang, 'ui_family_status_shifted'),
        tone: 'text-[#263C32] bg-[#DCE9DD]/75',
      };
    }
    if (
      memberItems.some((d) => d.status === 'proceed_with_precautions' || d.status === 'hold_pending_data') ||
      (plan.aqiValue !== null && plan.aqiValue > 100 && member.ageGroup !== 'adult')
    ) {
      return {
        label: t(lang, 'ui_family_status_precaution'),
        tone: 'text-[#8E5312] bg-[#F5EBD8]',
      };
    }
    return {
      label: t(lang, 'ui_family_status_ready'),
      tone: 'text-[#3B6E52] bg-[#DCE9DD]/50',
    };
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const { exportProtectionPlanPdf } = await import('../utils/pdfExport');
      await exportProtectionPlanPdf(household, plan, lang);
    } finally {
      setExportingPdf(false);
    }
  };

  const classificationKey = `cls_${plan.classification ?? (plan.isDemoFixture ? 'demo_fixture' : plan.isAvailable ? 'verified_live' : 'unavailable')}`;

  return (
    <div className="space-y-7">
      {/* Section A: Welcome & Action Header */}
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
            onClick={() => {
              onSaveSnapshot();
              setSavedNotice(true);
              setTimeout(() => setSavedNotice(false), 2500);
            }}
            className="px-3.5 py-2 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
          >
            {savedNotice ? t(lang, 'dash_savedNotice') : t(lang, 'action_persistPlan')}
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

      {/* Subtle Context / Conflict Bar */}
      {(plan.isDemoFixture || (plan.conflictWarningKey && plan.conflictDetails) || plan.historicalTrend) && (
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
                {plan.historicalTrend.previousPm25 ?? '—'} → {plan.historicalTrend.latestPm25 ?? '—'} µg/m³ ({plan.historicalTrend.sampleCount})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Section B: Hero Environmental Card + Family Protection Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Deep Forest Gradient Environmental Hero */}
        <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-[#263C32] via-[#2E493C] to-[#1A2B23] text-white p-6 lg:p-7 shadow-[0_12px_32px_rgba(38,60,50,0.14)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#DCE9DD]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/12 text-white font-medium text-[11px]">
                {t(lang, classificationKey)}
              </span>
              <span>
                {t(lang, 'dash_aqi_label')} · {t(lang, `dtype_${plan.dataType}`)}
              </span>
            </div>
            <span className="font-mono tabular-nums text-white/90">
              {t(lang, `fresh_${plan.freshness}`)}
            </span>
          </div>

          <div className="my-5 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            <div className="sm:col-span-5 flex justify-center">
              <AqiGauge
                aqi={plan.aqiValue}
                band={plan.aqiBand}
                bandLabel={t(lang, `band_${plan.aqiBand}`)}
                isAvailable={plan.isAvailable}
                darkSurface
                size="lg"
              />
            </div>

            <div className="sm:col-span-7 space-y-4">
              {plan.isAvailable && plan.aqiValue !== null ? (
                <>
                  <div>
                    <p className="font-display text-lg font-semibold text-white">
                      {plan.city}
                      {household.locality ? ` · ${household.locality}` : ''}
                    </p>
                    <p className="text-xs text-[#DCE9DD]">
                      {plan.aqiIsDerived ? t(lang, 'dash_derived_note') : t(lang, 'dash_reported_note')}
                    </p>
                  </div>

                  {/* India NAQI Spectrum Scale Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-[#DCE9DD]/85">
                      <span>{t(lang, 'ui_aqi_scale_label')}</span>
                      <span className="tabular-nums">0 — 450+</span>
                    </div>
                    <div className="relative h-2 w-full rounded-full overflow-hidden flex">
                      <div className="flex-1 bg-[#489C6E]" />
                      <div className="flex-1 bg-[#829C83]" />
                      <div className="flex-1 bg-[#D99B38]" />
                      <div className="flex-1 bg-[#D96B38]" />
                      <div className="flex-1 bg-[#C94438]" />
                      <div className="flex-1 bg-[#9E2323]" />
                      <motion.div
                        initial={{ left: '0%' }}
                        animate={{ left: `${bandIndexPercent(plan.aqiValue)}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#263C32] shadow-sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="font-display text-lg font-semibold text-white">
                    {t(lang, 'dash_unavailable_title')}
                  </p>
                  <p className="text-xs text-[#DCE9DD] leading-relaxed">
                    {t(lang, 'dash_unavailable_desc')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Provenance Footer Strip */}
          <div className="pt-4 border-t border-white/12 grid grid-cols-3 gap-3 text-xs">
            <div className="min-w-0">
              <span className="block text-[11px] text-[#DCE9DD]/75">{t(lang, 'dash_source')}</span>
              <span className="font-medium text-white truncate block">
                {primarySnapshot.providerLabel}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#DCE9DD]/75">{t(lang, 'dash_dominant')}</span>
              <span className="font-mono font-medium text-white">
                {plan.dominantPollutant ?? '—'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-[#DCE9DD]/75">
                {t(lang, 'dash_measured_at')}
              </span>
              <span className="font-mono tabular-nums font-medium text-white">
                {primarySnapshot.measuredAt
                  ? new Date(primarySnapshot.measuredAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Family Protection Summary Mint-Graduated Card */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E2E7E1] bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-[#DCE9DD]/45 p-6 lg:p-7 shadow-[0_1px_3px_rgba(37,45,40,0.04)] flex flex-col justify-between">
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

            {/* Visual Plan Breakdown Metrics */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3">
                <p className="font-mono text-xl font-bold text-[#3B6E52] tabular-nums">
                  {proceedCount}
                </p>
                <p className="mt-0.5 text-[11px] text-[#89918A] leading-tight">
                  {t(lang, 'ui_outdoor_ready')}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3">
                <p className="font-mono text-xl font-bold text-[#B4691E] tabular-nums">
                  {precautionCount}
                </p>
                <p className="mt-0.5 text-[11px] text-[#89918A] leading-tight">
                  {t(lang, 'ui_precautions_count')}
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3">
                <p className="font-mono text-xl font-bold text-[#263C32] tabular-nums">
                  {shiftCount}
                </p>
                <p className="mt-0.5 text-[11px] text-[#89918A] leading-tight">
                  {t(lang, 'ui_shift_count')}
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
      </section>

      {/* Section C: Family Protection Member Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            {t(lang, 'side_family')} ({members.length})
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('family')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#263C32] hover:underline underline-offset-4 cursor-pointer"
          >
            <span>{t(lang, 'tab_members')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((member) => {
            const Icon = memberAgeIcon(member.ageGroup);
            const status = getMemberStatus(member);
            const isSelected = selectedMemberFilter === member.name;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() =>
                  setSelectedMemberFilter((prev) => (prev === member.name ? 'all' : member.name))
                }
                className={`text-left rounded-xl p-4 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#DCE9DD]/65 to-white border-[#263C32] shadow-sm'
                    : 'bg-white border-[#E2E7E1] hover:border-[#829C83] shadow-[0_1px_3px_rgba(37,45,40,0.03)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#263C32] text-[#DCE9DD] flex items-center justify-center font-display text-sm font-semibold shrink-0">
                      {member.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#252D28] truncate">{member.name}</p>
                      <p className="text-[11px] text-[#89918A] truncate">
                        {t(lang, `pref_${member.activityPreference}`)}
                      </p>
                    </div>
                  </div>
                  <Icon className="w-4 h-4 text-[#829C83] shrink-0" />
                </div>

                <div className="mt-3.5 pt-3 border-t border-[#E2E7E1] flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#89918A] truncate">
                    {t(lang, `flex_${member.routineFlexibility}`)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-medium shrink-0 ${status.tone}`}>
                    {status.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section D: Environmental Analytics Charts */}
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

      {/* Section E & F: Visual Today's Protection Plan Timeline + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Timeline */}
        <section className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              {t(lang, 'dash_planner_heading')}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('planner')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#263C32] hover:underline underline-offset-4 cursor-pointer"
            >
              <span>{t(lang, 'side_planner')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5">
            {plan.dailyPlan.length === 0 ? (
              <p className="text-xs text-[#89918A]">{t(lang, 'ui_no_routines')}</p>
            ) : (
              <div className="relative pl-5 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[#E2E7E1]">
                {plan.dailyPlan.map((item) => {
                  const EnvIcon = item.environment === 'indoor' ? Home : item.suggestedWindow ? Sun : Bike;
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

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#89918A]">
                          <span>
                            {t(lang, `env_${item.environment}`)} · {item.applicableMembers.join(', ')}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#252D28] tabular-nums">
                            <Clock className="w-3 h-3 text-[#829C83]" />
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

        {/* Actionable Recommendations with Explainability Trail */}
        <section className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="px-6 py-4 border-b border-[#E2E7E1] flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              {t(lang, 'dash_actions_heading')}
            </h2>

            <div className="flex items-center gap-1 bg-[#F7F7F1] p-0.5 rounded-lg border border-[#E2E7E1] overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setSelectedMemberFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  selectedMemberFilter === 'all'
                    ? 'bg-white text-[#252D28] shadow-2xs'
                    : 'text-[#89918A] hover:text-[#252D28]'
                }`}
              >
                {t(lang, 'ui_all_members')}
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberFilter(m.name)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    selectedMemberFilter === m.name
                      ? 'bg-white text-[#252D28] shadow-2xs'
                      : 'text-[#89918A] hover:text-[#252D28]'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#E2E7E1]">
            {filteredRecommendations.map((rec) => {
              const isOpen = expandedRecId === rec.id;
              return (
                <div key={rec.id} className="p-5 hover:bg-[#F7F7F1]/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${severityDotColor(
                          rec.severity
                        )}`}
                      >
                        {rec.severity === 'elevated' || rec.severity === 'unavailable' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : rec.severity === 'nominal' ? (
                          <TreePine className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-semibold text-[#252D28]">
                          {t(lang, rec.titleKey, rec.titleParams)}
                        </h3>
                        <p className="text-xs font-medium text-[#263C32]">
                          {t(lang, rec.suggestedActionKey, rec.suggestedActionParams)}
                        </p>
                        <p className="text-[11px] text-[#89918A]">
                          {rec.applicableMembers.join(', ') || 'Household'} ·{' '}
                          {t(lang, `conf_${rec.confidenceOrLimitationKey}`)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpandedRecId(isOpen ? null : rec.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E2E7E1] bg-white text-xs text-[#252D28] hover:bg-[#DCE9DD]/40 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{t(lang, 'dash_evidenceBtn')}</span>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 ml-11 p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] text-xs space-y-2 text-[#89918A]">
                      <p className="text-[#252D28]">
                        {t(lang, rec.explanationKey, rec.explanationParams)}
                      </p>
                      <p>
                        <strong className="font-medium text-[#252D28]">
                          {t(lang, 'dash_reasonLabel')}:
                        </strong>{' '}
                        {t(lang, rec.reasonGeneratedKey, rec.reasonGeneratedParams)}
                      </p>
                      {rec.evidenceTrail && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E2E7E1]/80 text-[11px]">
                          <div>
                            <span className="font-semibold text-[#252D28]">
                              {t(lang, 'trail_evidence_label')}:
                            </span>{' '}
                            <span className="font-mono">{rec.evidenceTrail.evidenceMetric}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#252D28]">
                              {t(lang, 'trail_rule_label')}:
                            </span>{' '}
                            <span className="font-mono">{rec.evidenceTrail.ruleTriggered}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#252D28]">
                              {t(lang, 'trail_context_label')}:
                            </span>{' '}
                            <span>{rec.evidenceTrail.householdContext}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#263C32]">
                              {t(lang, 'trail_reconsider_label')}:
                            </span>{' '}
                            <span>{t(lang, rec.evidenceTrail.reconsiderWhenKey)}</span>
                          </div>
                        </div>
                      )}
                      <p className="font-mono tabular-nums text-[11px] pt-1 border-t border-[#E2E7E1]/60">
                        <strong className="font-sans font-medium text-[#252D28]">
                          {t(lang, 'dash_sourceLabel')}:
                        </strong>{' '}
                        {rec.supportingEvidence.providerLabel} ({rec.supportingEvidence.stationOrGridId}) ·
                        PM2.5 {rec.supportingEvidence.pm25 ?? 'N/A'} µg/m³ ·{' '}
                        {rec.sourceTimestamp ? new Date(rec.sourceTimestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
