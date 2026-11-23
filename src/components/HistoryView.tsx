import { useEffect, useState } from 'react';
import { FileDown } from 'lucide-react';
import type {
  EnvironmentalSnapshot,
  HouseholdProfile,
  LanguageCode,
  ProtectionPlanResult,
  ScenarioComparisonResult,
} from '../shared/types';
import { t } from '../i18n/translations';
import { HistoryKpiStrip } from './history/HistoryKpiStrip';
import { PlanInspectionModal } from './history/PlanInspectionModal';
import { HistoryPlansAndScenarios, HistorySnapshotsTable } from './history/HistoryTables';

interface HistoryViewProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  currentPlan: ProtectionPlanResult;
  plans: ProtectionPlanResult[];
  scenarios: ScenarioComparisonResult[];
  snapshots: EnvironmentalSnapshot[];
}

export function HistoryView({
  lang,
  household,
  currentPlan,
  plans,
  scenarios,
  snapshots,
}: HistoryViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<ProtectionPlanResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlan) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPlan(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPlan]);

  const handleExportPdf = async (plan: ProtectionPlanResult) => {
    setExporting(true);
    setExportError(null);
    try {
      const { exportProtectionPlanPdf } = await import('../utils/pdfExport');
      await exportProtectionPlanPdf(household, plan, lang);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Unable to export the PDF report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">
            {t(lang, 'hist_title')}
          </h1>
          <p className="mt-1 text-sm text-[#565F58]">{t(lang, 'hist_subtitle')}</p>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={() => void handleExportPdf(currentPlan)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <FileDown className="w-4 h-4" strokeWidth={1.7} />
          <span>{t(lang, 'action_downloadPdf')}</span>
        </button>
      </div>

      {exportError && (
        <p
          role="alert"
          className="rounded-lg border border-[#B33A2E]/35 bg-white px-4 py-3 text-xs text-[#9A2E24]"
        >
          {exportError}
        </p>
      )}

      <HistoryKpiStrip
        planCount={plans.length}
        scenarioCount={scenarios.length}
        snapshots={snapshots}
      />

      <HistoryPlansAndScenarios
        lang={lang}
        plans={plans}
        scenarios={scenarios}
        exporting={exporting}
        onInspectPlan={setSelectedPlan}
        onExportPdf={(p) => void handleExportPdf(p)}
      />

      <HistorySnapshotsTable lang={lang} snapshots={snapshots} />

      {selectedPlan && (
        <PlanInspectionModal
          lang={lang}
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onExportPdf={(p) => void handleExportPdf(p)}
        />
      )}
    </div>
  );
}
