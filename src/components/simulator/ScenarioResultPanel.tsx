import { ArrowRight, Sparkles } from 'lucide-react';
import type { LanguageCode, ScenarioComparisonResult } from '../../shared/types';
import { t } from '../../i18n/translations';
import { AqiGauge } from '../AqiGauge';

interface ScenarioResultPanelProps {
  lang: LanguageCode;
  result: ScenarioComparisonResult | null;
}

export function ScenarioResultPanel({ lang, result }: ScenarioResultPanelProps) {
  const aqiDelta =
    result && result.baselinePlan.aqiValue !== null && result.scenarioPlan.aqiValue !== null
      ? result.scenarioPlan.aqiValue - result.baselinePlan.aqiValue
      : null;

  return (
    <div className="lg:col-span-7 space-y-6" aria-live="polite">
      {!result ? (
        <div className="bg-white border border-[#E2E7E1] rounded-2xl p-10 text-center space-y-3 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="w-11 h-11 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="font-display text-base font-semibold text-[#252D28]">
            No scenario executed yet
          </p>
          <p className="text-xs text-[#89918A] max-w-md mx-auto">
            Select a preset card above or adjust PM2.5, PM10, AQI, and routine controls to visualize
            the delta against baseline evidence.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] font-medium text-[#829C83]">
                  {result.disclaimerBanner}
                </p>
                <h2 className="mt-1 font-display text-lg font-bold text-[#252D28]">
                  {result.modification.label}
                </h2>
              </div>
              {aqiDelta !== null && (
                <span className="font-mono text-xs font-semibold px-3 py-1 rounded-lg bg-[#F7F7F1] border border-[#E2E7E1] text-[#263C32] tabular-nums">
                  Delta {aqiDelta >= 0 ? `+${aqiDelta}` : aqiDelta} AQI
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 gap-4 items-center">
              <div className="sm:col-span-5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-4 flex flex-col items-center">
                <p className="text-xs font-medium text-[#89918A] mb-2">Baseline Evidence</p>
                <AqiGauge
                  aqi={result.baselinePlan.aqiValue}
                  band={result.baselinePlan.aqiBand}
                  bandLabel={t(lang, `band_${result.baselinePlan.aqiBand}`)}
                  isAvailable={result.baselinePlan.isAvailable}
                  size="sm"
                />
                <p className="mt-1 text-[11px] text-[#89918A]">
                  {t(lang, `fresh_${result.baselinePlan.freshness}`)}
                </p>
              </div>

              <div className="sm:col-span-1 flex justify-center">
                <ArrowRight className="w-5 h-5 text-[#829C83] rotate-90 sm:rotate-0" />
              </div>

              <div className="sm:col-span-5 rounded-xl bg-gradient-to-br from-[#263C32] to-[#1D2E26] text-white p-4 flex flex-col items-center">
                <p className="text-xs font-medium text-[#DCE9DD] mb-2">Hypothetical Scenario</p>
                <AqiGauge
                  aqi={result.scenarioPlan.aqiValue}
                  band={result.scenarioPlan.aqiBand}
                  bandLabel={t(lang, `band_${result.scenarioPlan.aqiBand}`)}
                  isAvailable={result.scenarioPlan.isAvailable}
                  darkSurface
                  size="sm"
                />
                <p className="mt-1 text-[11px] text-[#DCE9DD]">
                  {t(lang, `fresh_${result.scenarioPlan.freshness}`)}
                </p>
              </div>
            </div>

            <ul className="space-y-1 text-xs text-[#89918A] list-disc list-inside">
              {result.changeSummaryKeys.map((k) => (
                <li key={k}>{t(lang, k)}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
            <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-[#252D28]">
                Resulting Schedule
              </h3>
              <span className="font-mono text-xs text-[#89918A] tabular-nums">
                {result.changedScheduleCount} shifted
              </span>
            </div>
            <div className="divide-y divide-[#E2E7E1]">
              {result.scenarioPlan.dailyPlan.map((item) => {
                const baseItem = result.baselinePlan.dailyPlan.find(
                  (b) => b.routineId === item.routineId
                );
                const changed =
                  !baseItem ||
                  baseItem.status !== item.status ||
                  baseItem.suggestedWindow !== item.suggestedWindow;
                return (
                  <div
                    key={item.routineId}
                    className={`px-6 py-4 flex items-start justify-between gap-4 ${
                      changed ? 'bg-[#DCE9DD]/25' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#252D28]">
                        {item.routineTitle}
                        {changed && (
                          <span className="ml-2 text-xs font-medium text-[#263C32]">(Changed)</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[#89918A]">
                        {t(lang, item.rationaleKey, item.rationaleParams)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-[#263C32]">
                        {t(lang, `status_${item.status}`)}
                      </p>
                      {item.suggestedWindow && (
                        <p className="font-mono text-xs text-[#3B6E52] tabular-nums">
                          → {item.suggestedWindow}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
