import { useState } from 'react';
import { ArrowRight, SlidersHorizontal, Sparkles } from 'lucide-react';
import type {
  ActivityRoutine,
  LanguageCode,
  ScenarioComparisonResult,
  ScenarioModification,
  TimeWindow,
} from '../shared/types';
import { t } from '../i18n/translations';
import { AqiGauge } from './AqiGauge';

interface SimulatorViewProps {
  lang: LanguageCode;
  routines: ActivityRoutine[];
  currentPm25: number | null;
  currentPm10?: number | null;
  onRunScenario: (mod: ScenarioModification) => Promise<ScenarioComparisonResult>;
}

const TIME_WINDOWS: TimeWindow[] = [
  '06:00-09:00',
  '09:00-12:00',
  '12:00-16:00',
  '16:00-19:00',
  '19:00-22:00',
];

function previewBandForPm25(pm25: number): string {
  if (pm25 <= 30) return 'Good';
  if (pm25 <= 60) return 'Satisfactory';
  if (pm25 <= 90) return 'Moderate';
  if (pm25 <= 120) return 'Poor';
  if (pm25 <= 250) return 'Very Poor';
  return 'Severe';
}

export function SimulatorView({
  lang,
  routines,
  currentPm25,
  currentPm10 = null,
  onRunScenario,
}: SimulatorViewProps) {
  const [label, setLabel] = useState('Evening traffic pollution spike');
  const [pm25Override, setPm25Override] = useState<number>(currentPm25 ?? 68);
  const [usePmOverride, setUsePmOverride] = useState(true);
  const [usePm10Override, setUsePm10Override] = useState(false);
  const [pm10Override, setPm10Override] = useState<number>(currentPm10 ?? 140);
  const [useAqiOverride, setUseAqiOverride] = useState(false);
  const [aqiOverride, setAqiOverride] = useState<number>(180);
  const [simulateStale, setSimulateStale] = useState(false);
  const [simulateUnavailable, setSimulateUnavailable] = useState(false);
  const [overrideRoutineId, setOverrideRoutineId] = useState<string>(routines[0]?.id ?? '');
  const [overrideEnvironment, setOverrideEnvironment] = useState<'outdoor' | 'indoor'>('indoor');
  const [overrideWindow, setOverrideWindow] = useState<TimeWindow>('12:00-16:00');
  const [applyRoutineOverride, setApplyRoutineOverride] = useState(false);
  const [forecastTrendOverride, setForecastTrendOverride] = useState<
    'none' | 'improving' | 'stable' | 'worsening'
  >('none');

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ScenarioComparisonResult | null>(null);

  const runPreset = async (mod: ScenarioModification) => {
    setLabel(mod.label);
    if (typeof mod.pm25Override === 'number') {
      setUsePmOverride(true);
      setPm25Override(mod.pm25Override);
    }
    setUsePm10Override(typeof mod.pm10Override === 'number');
    if (typeof mod.pm10Override === 'number') setPm10Override(mod.pm10Override);
    setUseAqiOverride(typeof mod.aqiOverride === 'number');
    if (typeof mod.aqiOverride === 'number') setAqiOverride(mod.aqiOverride);
    setSimulateStale(Boolean(mod.simulateStale));
    setSimulateUnavailable(Boolean(mod.simulateUnavailable));
    setForecastTrendOverride(mod.forecastTrendOverride ?? 'none');
    setRunning(true);
    try {
      const res = await onRunScenario(mod);
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    try {
      const mod: ScenarioModification = {
        label: label.trim() || 'Custom Hypothetical Scenario',
        pm25Override: usePmOverride && !simulateUnavailable ? pm25Override : null,
        pm10Override: usePm10Override && !simulateUnavailable ? pm10Override : null,
        aqiOverride: useAqiOverride && !simulateUnavailable ? aqiOverride : null,
        simulateStale,
        simulateUnavailable,
        overrideRoutineId: applyRoutineOverride && overrideRoutineId ? overrideRoutineId : undefined,
        overrideEnvironment: applyRoutineOverride ? overrideEnvironment : undefined,
        overrideWindow: applyRoutineOverride ? overrideWindow : undefined,
        forecastTrendOverride,
      };
      const res = await onRunScenario(mod);
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  const aqiDelta =
    result &&
    result.baselinePlan.aqiValue !== null &&
    result.scenarioPlan.aqiValue !== null
      ? result.scenarioPlan.aqiValue - result.baselinePlan.aqiValue
      : null;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'sim_title')}</h1>
        <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'sim_subtitle')}</p>
      </div>

      {/* Prominent Forest Disclaimer Banner */}
      <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#263C32] to-[#1D2F27] text-[#DCE9DD] font-mono text-xs font-medium tracking-wide shadow-xs">
        {t(lang, 'scenario_banner')}
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: 'PM2.5 Spike',
            metric: '145 µg/m³',
            sub: 'Simulate worsening peak',
            mod: {
              label: 'What if PM2.5 spikes to 145 µg/m³?',
              pm25Override: 145,
              forecastTrendOverride: 'worsening' as const,
            },
          },
          {
            title: 'Dust Event (PM10)',
            metric: '260 µg/m³',
            sub: 'Road / construction dust storm',
            mod: {
              label: 'What if PM10 rises to 260 µg/m³?',
              pm25Override: 48,
              pm10Override: 260,
            },
          },
          {
            title: 'Afternoon Clear',
            metric: '32 µg/m³',
            sub: 'Dispersion improves air',
            mod: {
              label: 'What if afternoon air clears to 32 µg/m³?',
              pm25Override: 32,
              forecastTrendOverride: 'improving' as const,
            },
          },
          {
            title: 'Stale Sensor',
            metric: '> 6h old',
            sub: 'Test confidence drop',
            mod: {
              label: 'What if monitoring data becomes stale (> 6h)?',
              simulateStale: true,
            },
          },
        ].map((preset) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => void runPreset(preset.mod)}
            className="text-left bg-white border border-[#E2E7E1] rounded-xl p-4 hover:border-[#263C32] hover:bg-[#DCE9DD]/25 transition-colors cursor-pointer shadow-[0_1px_3px_rgba(37,45,40,0.03)]"
          >
            <p className="font-mono text-xs font-semibold text-[#263C32]">{preset.metric}</p>
            <p className="mt-1 font-display text-sm font-semibold text-[#252D28]">{preset.title}</p>
            <p className="mt-0.5 text-[11px] text-[#89918A]">{preset.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleCustomSubmit}
          className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
        >
          <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#829C83]" strokeWidth={1.8} />
            <span>Scenario Parameters</span>
          </h2>

          <div>
            <label htmlFor="sim-label-input" className="block text-xs text-[#89918A] mb-1">
              Scenario Label
            </label>
            <input
              id="sim-label-input"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
            />
          </div>

          <div className="space-y-2.5 border-t border-[#E2E7E1] pt-4">
            <label className="flex items-center gap-2 text-xs font-medium text-[#252D28]">
              <input
                type="checkbox"
                checked={usePmOverride}
                onChange={(e) => setUsePmOverride(e.target.checked)}
                className="accent-[#263C32]"
              />
              <span>Override Hypothetical PM2.5</span>
            </label>
            {usePmOverride && (
              <div className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-2">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-[#89918A]">
                    Est. Band: <strong className="text-[#252D28]">{previewBandForPm25(pm25Override)}</strong>
                  </span>
                  <span className="font-semibold text-[#263C32]">{pm25Override} µg/m³</span>
                </div>
                <input
                  type="range"
                  aria-label="Hypothetical PM2.5 slider"
                  min={10}
                  max={300}
                  value={pm25Override}
                  onChange={(e) => setPm25Override(Number(e.target.value))}
                  className="w-full accent-[#263C32] cursor-pointer"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs font-medium text-[#252D28] pt-1">
              <input
                type="checkbox"
                checked={usePm10Override}
                onChange={(e) => setUsePm10Override(e.target.checked)}
                className="accent-[#263C32]"
              />
              <span>{t(lang, 'ui_pm10_override')}</span>
            </label>
            {usePm10Override && (
              <div className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-1.5">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-[#89918A]">PM10</span>
                  <span className="font-semibold text-[#263C32]">{pm10Override} µg/m³</span>
                </div>
                <input
                  type="range"
                  aria-label={t(lang, 'ui_pm10_override')}
                  min={20}
                  max={500}
                  value={pm10Override}
                  onChange={(e) => setPm10Override(Number(e.target.value))}
                  className="w-full accent-[#263C32] cursor-pointer"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs font-medium text-[#252D28] pt-1">
              <input
                type="checkbox"
                checked={useAqiOverride}
                onChange={(e) => setUseAqiOverride(e.target.checked)}
                className="accent-[#263C32]"
              />
              <span>{t(lang, 'ui_aqi_override')}</span>
            </label>
            {useAqiOverride && (
              <div className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-1.5">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-[#89918A]">India NAQI</span>
                  <span className="font-semibold text-[#263C32]">{aqiOverride}</span>
                </div>
                <input
                  type="range"
                  aria-label={t(lang, 'ui_aqi_override')}
                  min={15}
                  max={450}
                  value={aqiOverride}
                  onChange={(e) => setAqiOverride(Number(e.target.value))}
                  className="w-full accent-[#263C32] cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="border-t border-[#E2E7E1] pt-4">
            <label htmlFor="sim-forecast-trend" className="block text-xs text-[#89918A] mb-1">
              Forecast Trend
            </label>
            <select
              id="sim-forecast-trend"
              value={forecastTrendOverride}
              onChange={(e) =>
                setForecastTrendOverride(
                  e.target.value as 'none' | 'improving' | 'stable' | 'worsening'
                )
              }
              className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
            >
              <option value="none">Keep baseline forecast</option>
              <option value="improving">Afternoon dispersion improves air</option>
              <option value="worsening">Air quality worsens through the day</option>
            </select>
          </div>

          {routines.length > 0 && (
            <div className="space-y-3 border-t border-[#E2E7E1] pt-4">
              <label className="flex items-center gap-2 text-xs font-medium text-[#252D28]">
                <input
                  type="checkbox"
                  checked={applyRoutineOverride}
                  onChange={(e) => setApplyRoutineOverride(e.target.checked)}
                  className="accent-[#263C32]"
                />
                <span>Modify a Routine</span>
              </label>
              {applyRoutineOverride && (
                <div className="space-y-2">
                  <select
                    aria-label="Select routine to override"
                    value={overrideRoutineId}
                    onChange={(e) => setOverrideRoutineId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                  >
                    {routines.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label="Override environment"
                      value={overrideEnvironment}
                      onChange={(e) =>
                        setOverrideEnvironment(e.target.value as 'outdoor' | 'indoor')
                      }
                      className="px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                    >
                      <option value="indoor">{t(lang, 'env_indoor')}</option>
                      <option value="outdoor">{t(lang, 'env_outdoor')}</option>
                    </select>
                    <select
                      aria-label="Override time window"
                      value={overrideWindow}
                      onChange={(e) => setOverrideWindow(e.target.value as TimeWindow)}
                      className="px-3 py-2 text-xs font-mono bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                    >
                      {TIME_WINDOWS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 border-t border-[#E2E7E1] pt-4 text-xs text-[#252D28]">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={simulateStale}
                onChange={(e) => setSimulateStale(e.target.checked)}
                className="accent-[#263C32]"
              />
              <span>Simulate Stale Sensor (&gt; 6h)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={simulateUnavailable}
                onChange={(e) => setSimulateUnavailable(e.target.checked)}
                className="accent-[#263C32]"
              />
              <span>Simulate Data Unavailable</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={running}
            className="w-full px-4 py-2.5 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
          >
            {t(lang, 'action_runScenario')}
          </button>
        </form>

        <div className="lg:col-span-7 space-y-6">
          {!result ? (
            <div className="bg-white border border-[#E2E7E1] rounded-2xl p-10 text-center space-y-3 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
              <div className="w-11 h-11 rounded-xl bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="font-display text-base font-semibold text-[#252D28]">
                No scenario executed yet
              </p>
              <p className="text-xs text-[#89918A] max-w-md mx-auto">
                Select a preset card above or adjust PM2.5, PM10, AQI, and routine controls to visualize the delta against baseline evidence.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dual Gauge Comparison Card */}
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

              {/* Resulting Schedule */}
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
                              <span className="ml-2 text-xs font-medium text-[#263C32]">
                                (Changed)
                              </span>
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
      </div>
    </div>
  );
}
