import { ArrowRight, Sparkles } from 'lucide-react';
import type { LanguageCode, ScenarioComparisonResult } from '../../shared/types';
import { t } from '../../i18n/translations';
import { AqiGauge } from '../AqiGauge';
import { ScenarioScheduleDiffList } from './ScenarioScheduleDiffList';

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
          <p className="text-xs text-[#565F58] max-w-md mx-auto">
            Select a preset card above or adjust PM2.5, PM10, AQI, and routine controls to visualize
            the delta against baseline evidence.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] font-medium text-[#3B6E52]">
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
                <p className="text-xs font-medium text-[#565F58] mb-2">Baseline Evidence</p>
                <AqiGauge
                  aqi={result.baselinePlan.aqiValue}
                  band={result.baselinePlan.aqiBand}
                  bandLabel={t(lang, `band_${result.baselinePlan.aqiBand}`)}
                  isAvailable={result.baselinePlan.isAvailable}
                  size="sm"
                />
                <p className="mt-1 text-[11px] text-[#565F58]">
                  {t(lang, `fresh_${result.baselinePlan.freshness}`)}
                </p>
              </div>

              <div className="sm:col-span-1 flex justify-center">
                <ArrowRight className="w-5 h-5 text-[#4D6B50] rotate-90 sm:rotate-0" />
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

            <ul className="space-y-1 text-xs text-[#565F58] list-disc list-inside">
              {result.changeSummaryKeys.map((k) => (
                <li key={k}>{t(lang, k)}</li>
              ))}
            </ul>
          </div>

          <ScenarioScheduleDiffList lang={lang} result={result} />
        </div>
      )}
    </div>
  );
}
