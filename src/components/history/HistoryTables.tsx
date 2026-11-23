import { Eye } from 'lucide-react';
import type {
  EnvironmentalSnapshot,
  LanguageCode,
  ProtectionPlanResult,
  ScenarioComparisonResult,
} from '../../shared/types';
import { t } from '../../i18n/translations';

interface HistoryPlansAndScenariosProps {
  lang: LanguageCode;
  plans: ProtectionPlanResult[];
  scenarios: ScenarioComparisonResult[];
  exporting: boolean;
  onInspectPlan: (plan: ProtectionPlanResult) => void;
  onExportPdf: (plan: ProtectionPlanResult) => void;
}

export function HistoryPlansAndScenarios({
  lang,
  plans,
  scenarios,
  exporting,
  onInspectPlan,
  onExportPdf,
}: HistoryPlansAndScenariosProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
        <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            Saved Protection Plans
          </h2>
          <span className="font-mono text-xs text-[#565F58] tabular-nums">{plans.length}</span>
        </div>
        {plans.length === 0 ? (
          <p className="p-6 text-xs text-[#565F58]">
            No saved plan snapshots yet. Use &ldquo;{t(lang, 'action_persistPlan')}&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-[#E2E7E1]">
            {plans.map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-semibold text-[#252D28]">
                    {p.city} ·{' '}
                    {p.aqiValue !== null ? `AQI ${p.aqiValue}` : t(lang, 'band_unavailable')} (
                    {t(lang, `band_${p.aqiBand}`)})
                  </p>
                  <p className="font-mono text-[#565F58] tabular-nums mt-0.5">
                    {new Date(p.generatedAt).toLocaleString()}
                    {p.isDemoFixture ? ` · ${t(lang, 'cls_demo_fixture')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onInspectPlan(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E7E1] bg-white font-medium text-[#252D28] hover:bg-[#F7F7F1] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t(lang, 'action_inspect')}</span>
                  </button>
                  <button
                    type="button"
                    disabled={exporting}
                    onClick={() => onExportPdf(p)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E7E1] bg-[#F7F7F1] font-medium text-[#263C32] hover:bg-[#DCE9DD]/50 cursor-pointer"
                  >
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
        <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            What-If Scenario Log
          </h2>
          <span className="font-mono text-xs text-[#565F58] tabular-nums">{scenarios.length}</span>
        </div>
        {scenarios.length === 0 ? (
          <p className="p-6 text-xs text-[#565F58]">No scenarios run yet.</p>
        ) : (
          <div className="divide-y divide-[#E2E7E1]">
            {scenarios.map((s) => (
              <div key={s.id} className="px-6 py-4 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#252D28]">{s.modification.label}</span>
                  <span className="font-mono text-[#3B6E52]">SCENARIO</span>
                </div>
                <p className="font-mono text-[#565F58] tabular-nums">
                  Baseline {s.baselinePlan.aqiValue ?? 'N/A'} → Scenario{' '}
                  {s.scenarioPlan.aqiValue ?? 'N/A'} · {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface HistorySnapshotsTableProps {
  lang: LanguageCode;
  snapshots: EnvironmentalSnapshot[];
}

export function HistorySnapshotsTable({ lang, snapshots }: HistorySnapshotsTableProps) {
  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">Recorded Snapshots</h2>
        <span className="font-mono text-xs text-[#565F58] tabular-nums">{snapshots.length}</span>
      </div>
      {snapshots.length === 0 ? (
        <p className="p-6 text-xs text-[#565F58]">No snapshots stored.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E7E1] text-[#565F58] bg-[#F7F7F1]/55">
                <th className="py-2.5 px-5 font-medium">City & Station</th>
                <th className="py-2.5 px-4 font-medium">Provider</th>
                <th className="py-2.5 px-4 font-medium text-right">PM2.5</th>
                <th className="py-2.5 px-4 font-medium">Freshness</th>
                <th className="py-2.5 px-5 font-medium">{t(lang, 'dash_retrieved_at')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E7E1]">
              {snapshots.map((snap) => (
                <tr key={snap.id} className="hover:bg-[#F7F7F1]/50">
                  <td className="py-3 px-5 font-medium text-[#252D28]">
                    {snap.city} · {snap.stationOrGridId}
                  </td>
                  <td className="py-3 px-4 text-[#565F58]">{snap.providerLabel}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {snap.pollutants.pm25 ?? '—'}
                  </td>
                  <td className="py-3 px-4">{t(lang, `fresh_${snap.freshness}`)}</td>
                  <td className="py-3 px-5 font-mono tabular-nums text-[#565F58]">
                    {new Date(snap.retrievedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
