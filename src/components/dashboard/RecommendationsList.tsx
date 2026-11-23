import { AlertTriangle, ChevronDown, ChevronUp, Sparkles, TreePine } from 'lucide-react';
import type { FamilyMember, LanguageCode, Recommendation } from '../../shared/types';
import { t } from '../../i18n/translations';
import { severityDotColor } from './dashboardHelpers';

interface RecommendationsListProps {
  lang: LanguageCode;
  members: FamilyMember[];
  recommendations: Recommendation[];
  selectedMemberFilter: string;
  expandedRecId: string | null;
  onSelectMemberFilter: (filter: string) => void;
  onToggleExpand: (id: string | null) => void;
}

export function RecommendationsList({
  lang,
  members,
  recommendations,
  selectedMemberFilter,
  expandedRecId,
  onSelectMemberFilter,
  onToggleExpand,
}: RecommendationsListProps) {
  const filteredRecommendations =
    selectedMemberFilter === 'all'
      ? recommendations
      : recommendations.filter((r) => r.applicableMembers.includes(selectedMemberFilter));

  return (
    <section className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="px-6 py-4 border-b border-[#E2E7E1] flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">
          {t(lang, 'dash_actions_heading')}
        </h2>

        <div className="flex items-center gap-1 bg-[#F7F7F1] p-0.5 rounded-lg border border-[#E2E7E1] overflow-x-auto max-w-full">
          <button
            type="button"
            aria-pressed={selectedMemberFilter === 'all'}
            onClick={() => onSelectMemberFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              selectedMemberFilter === 'all'
                ? 'bg-white text-[#252D28] shadow-2xs'
                : 'text-[#525C56] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'ui_all_members')}
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={selectedMemberFilter === m.name}
              onClick={() => onSelectMemberFilter(m.name)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                selectedMemberFilter === m.name
                  ? 'bg-white text-[#252D28] shadow-2xs'
                  : 'text-[#525C56] hover:text-[#252D28]'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[#E2E7E1]" aria-live="polite">
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
                    <p className="text-[11px] text-[#525C56]">
                      {rec.applicableMembers.join(', ') || 'Household'} ·{' '}
                      {t(lang, `conf_${rec.confidenceOrLimitationKey}`)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => onToggleExpand(isOpen ? null : rec.id)}
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
                <div className="mt-3 ml-11 p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] text-xs space-y-2 text-[#525C56]">
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
                    {rec.supportingEvidence.providerLabel} ({rec.supportingEvidence.stationOrGridId}
                    ) · PM2.5 {rec.supportingEvidence.pm25 ?? 'N/A'} µg/m³ ·{' '}
                    {rec.sourceTimestamp ? new Date(rec.sourceTimestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
