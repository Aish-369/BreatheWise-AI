import { Activity, FileDown, FileText, SlidersHorizontal } from 'lucide-react';
import type {
  EnvironmentalSnapshot,
  HouseholdProfile,
  LanguageCode,
  ProtectionPlanResult,
  ScenarioComparisonResult,
} from '../shared/types';
import { t } from '../i18n/translations';
import { exportProtectionPlanPdf } from '../utils/pdfExport';

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
  const pmPoints = snapshots
    .filter((s) => typeof s.pollutants.pm25 === 'number')
    .slice(0, 10)
    .reverse();
  const maxPm = Math.max(80, ...pmPoints.map((s) => s.pollutants.pm25 ?? 0));

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'hist_title')}</h1>
          <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'hist_subtitle')}</p>
        </div>

        <button
          type="button"
          onClick={() => exportProtectionPlanPdf(household, currentPlan, lang)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          <FileDown className="w-4 h-4" strokeWidth={1.7} />
          <span>{t(lang, 'action_downloadPdf')}</span>
        </button>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div>
            <p className="text-xs text-[#89918A]">Saved Plans</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#252D28] tabular-nums">
              {plans.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div>
            <p className="text-xs text-[#89918A]">What-If Scenarios</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#252D28] tabular-nums">
              {scenarios.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div>
            <p className="text-xs text-[#89918A]">Recorded Snapshots</p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#252D28] tabular-nums">
              {snapshots.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Historical Snapshot PM2.5 Trend (Only when >= 2 recorded snapshots exist) */}
      {pmPoints.length >= 2 && (
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              Recorded Session Snapshots (PM2.5 µg/m³)
            </h2>
            <span className="font-mono text-[#89918A]">{pmPoints.length} logged points</span>
          </div>
          <div className="flex items-end gap-4 h-32 pt-3 border-t border-[#E2E7E1] overflow-x-auto">
            {pmPoints.map((snap) => {
              const val = snap.pollutants.pm25 ?? 0;
              const hPct = Math.max(14, Math.round((val / maxPm) * 100));
              return (
                <div key={snap.id} className="w-16 shrink-0 flex flex-col items-center gap-1.5">
                  <span className="font-mono text-[11px] font-medium text-[#252D28] tabular-nums">
                    {val}
                  </span>
                  <div className="w-10 h-16 bg-[#F7F7F1] rounded-md flex items-end p-0.5">
                    <div
                      style={{ height: `${hPct}%` }}
                      className="w-full rounded bg-gradient-to-t from-[#263C32] to-[#829C83]"
                      title={`${snap.stationOrGridId}: ${val} µg/m³`}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#89918A] truncate w-full text-center">
                    {snap.stationOrGridId.split('-').slice(-2, -1)[0] || snap.city}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Saved Plans */}
        <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              Saved Protection Plans
            </h2>
            <span className="font-mono text-xs text-[#89918A] tabular-nums">{plans.length}</span>
          </div>
          {plans.length === 0 ? (
            <p className="p-6 text-xs text-[#89918A]">
              No saved plan snapshots yet. Use "Save Snapshot to History" on Overview.
            </p>
          ) : (
            <div className="divide-y divide-[#E2E7E1]">
              {plans.map((p) => (
                <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-[#252D28]">
                      {p.city} · {p.aqiValue !== null ? `AQI ${p.aqiValue}` : 'Unavailable'} (
                      {t(lang, `band_${p.aqiBand}`)})
                    </p>
                    <p className="font-mono text-[#89918A] tabular-nums mt-0.5">
                      {new Date(p.generatedAt).toLocaleString()}
                      {p.isDemoFixture ? ' · Demo Fixture' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportProtectionPlanPdf(household, p, lang)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E7E1] bg-[#F7F7F1] font-medium text-[#263C32] hover:bg-[#DCE9DD]/50 shrink-0 cursor-pointer"
                  >
                    PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scenario Run Log */}
        <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              What-If Scenario Log
            </h2>
            <span className="font-mono text-xs text-[#89918A] tabular-nums">
              {scenarios.length}
            </span>
          </div>
          {scenarios.length === 0 ? (
            <p className="p-6 text-xs text-[#89918A]">No scenarios run yet.</p>
          ) : (
            <div className="divide-y divide-[#E2E7E1]">
              {scenarios.map((s) => (
                <div key={s.id} className="px-6 py-4 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#252D28]">{s.modification.label}</span>
                    <span className="font-mono text-[#829C83]">SCENARIO</span>
                  </div>
                  <p className="font-mono text-[#89918A] tabular-nums">
                    Baseline {s.baselinePlan.aqiValue ?? 'N/A'} → Scenario{' '}
                    {s.scenarioPlan.aqiValue ?? 'N/A'} · {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Table */}
      <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
        <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">Recorded Snapshots</h2>
          <span className="font-mono text-xs text-[#89918A] tabular-nums">{snapshots.length}</span>
        </div>
        {snapshots.length === 0 ? (
          <p className="p-6 text-xs text-[#89918A]">No snapshots stored.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E7E1] text-[#89918A] bg-[#F7F7F1]/55">
                  <th className="py-2.5 px-5 font-medium">City & Station</th>
                  <th className="py-2.5 px-4 font-medium">Provider</th>
                  <th className="py-2.5 px-4 font-medium text-right">PM2.5</th>
                  <th className="py-2.5 px-4 font-medium">Freshness</th>
                  <th className="py-2.5 px-5 font-medium">Retrieved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E1]">
                {snapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-[#F7F7F1]/50">
                    <td className="py-3 px-5 font-medium text-[#252D28]">
                      {snap.city} · {snap.stationOrGridId}
                    </td>
                    <td className="py-3 px-4 text-[#89918A]">{snap.providerLabel}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {snap.pollutants.pm25 ?? '—'}
                    </td>
                    <td className="py-3 px-4">{t(lang, `fresh_${snap.freshness}`)}</td>
                    <td className="py-3 px-5 font-mono tabular-nums text-[#89918A]">
                      {new Date(snap.retrievedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
