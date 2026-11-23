import { X } from 'lucide-react';
import type { LanguageCode, ProtectionPlanResult } from '../../shared/types';
import { t } from '../../i18n/translations';

interface PlanInspectionModalProps {
  lang: LanguageCode;
  plan: ProtectionPlanResult;
  onClose: () => void;
  onExportPdf: (plan: ProtectionPlanResult) => void;
}

export function PlanInspectionModal({
  lang,
  plan,
  onClose,
  onExportPdf,
}: PlanInspectionModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252D28]/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-[#E2E7E1] shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between bg-[#F7F7F1]">
          <div>
            <h3
              id="plan-modal-title"
              className="font-display text-base font-semibold text-[#252D28]"
            >
              {t(lang, 'ui_modal_plan_detail')}
            </h3>
            <p className="font-mono text-[11px] text-[#565F58]">
              {plan.city} · AQI {plan.aqiValue ?? 'N/A'} ({t(lang, `band_${plan.aqiBand}`)}) ·{' '}
              {new Date(plan.generatedAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            aria-label={t(lang, 'action_close')}
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#565F58] hover:text-[#252D28] hover:bg-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          <p className="text-sm text-[#252D28] leading-relaxed">
            {t(lang, plan.summaryKey, plan.summaryParams)}
          </p>

          <div className="space-y-2.5">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-[#565F58]">
              {t(lang, 'dash_actions_heading')}
            </h4>
            {plan.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-1"
              >
                <p className="font-semibold text-[#252D28]">
                  {t(lang, rec.titleKey, rec.titleParams)}
                </p>
                <p className="text-[#263C32]">
                  {t(lang, rec.suggestedActionKey, rec.suggestedActionParams)}
                </p>
                <p className="text-[11px] text-[#565F58]">
                  {rec.supportingEvidence.providerLabel} · PM2.5{' '}
                  {rec.supportingEvidence.pm25 ?? 'N/A'} µg/m³
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-[#565F58]">
              {t(lang, 'dash_planner_heading')}
            </h4>
            {plan.dailyPlan.map((item) => (
              <div
                key={item.routineId}
                className="p-3 rounded-xl border border-[#E2E7E1] flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-[#252D28]">{item.routineTitle}</p>
                  <p className="text-[11px] text-[#565F58]">
                    {t(lang, item.rationaleKey, item.rationaleParams)}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-[#263C32] shrink-0">
                  {t(lang, `status_${item.status}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-[#E2E7E1] bg-[#F7F7F1] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onExportPdf(plan)}
            className="px-3.5 py-1.5 text-xs font-medium bg-[#263C32] text-white rounded-lg cursor-pointer"
          >
            {t(lang, 'action_downloadPdf')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium border border-[#E2E7E1] bg-white rounded-lg cursor-pointer"
          >
            {t(lang, 'action_close')}
          </button>
        </div>
      </div>
    </div>
  );
}
