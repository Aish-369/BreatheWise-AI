import { AlertTriangle, ChevronDown, ChevronUp, Sparkles, TreePine } from 'lucide-react';
import type { LanguageCode, Recommendation } from '../../shared/types';
import { t } from '../../i18n/translations';
import { severityDotColor } from './dashboardHelpers';

interface RecommendationCardProps {
  lang: LanguageCode;
  rec: Recommendation;
  isOpen: boolean;
  onToggleExpand: () => void;
}

export function RecommendationCard({ lang, rec, isOpen, onToggleExpand }: RecommendationCardProps) {
  return (
    <div className="p-5 hover:bg-[#F7F7F1]/40 transition-colors">
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
          onClick={onToggleExpand}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E2E7E1] bg-white text-xs text-[#252D28] hover:bg-[#DCE9DD]/40 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{t(lang, 'dash_evidenceBtn')}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 ml-11 p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] text-xs space-y-2 text-[#525C56]">
          <p className="text-[#252D28]">{t(lang, rec.explanationKey, rec.explanationParams)}</p>
          <p>
            <strong className="font-medium text-[#252D28]">{t(lang, 'dash_reasonLabel')}:</strong>{' '}
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
                <span className="font-semibold text-[#252D28]">{t(lang, 'trail_rule_label')}:</span>{' '}
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
}
