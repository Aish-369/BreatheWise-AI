import { SlidersHorizontal } from 'lucide-react';
import type { Dispatch } from 'react';
import type { ActivityRoutine, LanguageCode, TimeWindow } from '../../shared/types';
import { t } from '../../i18n/translations';
import { TIME_WINDOWS } from '../planner/plannerFormReducer';
import type { SimulatorAction, SimulatorState } from './simulatorReducer';

function previewBandForPm25(pm25: number): string {
  if (pm25 <= 30) return 'Good';
  if (pm25 <= 60) return 'Satisfactory';
  if (pm25 <= 90) return 'Moderate';
  if (pm25 <= 120) return 'Poor';
  if (pm25 <= 250) return 'Very Poor';
  return 'Severe';
}

interface ScenarioParametersFormProps {
  lang: LanguageCode;
  routines: ActivityRoutine[];
  state: SimulatorState;
  dispatch: Dispatch<SimulatorAction>;
  onSubmit: (e: React.FormEvent) => void;
}

export function ScenarioParametersForm({
  lang,
  routines,
  state,
  dispatch,
  onSubmit,
}: ScenarioParametersFormProps) {
  return (
    <form
      onSubmit={onSubmit}
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
          value={state.label}
          onChange={(e) => dispatch({ type: 'setField', field: 'label', value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        />
      </div>

      <div className="space-y-2.5 border-t border-[#E2E7E1] pt-4">
        <label className="flex items-center gap-2 text-xs font-medium text-[#252D28]">
          <input
            type="checkbox"
            checked={state.usePmOverride}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'usePmOverride', value: e.target.checked })
            }
            className="accent-[#263C32]"
          />
          <span>Override Hypothetical PM2.5</span>
        </label>
        {state.usePmOverride && (
          <div className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-2">
            <div className="flex justify-between text-xs font-mono tabular-nums">
              <span className="text-[#89918A]">
                Est. Band:{' '}
                <strong className="text-[#252D28]">{previewBandForPm25(state.pm25Override)}</strong>
              </span>
              <span className="font-semibold text-[#263C32]">{state.pm25Override} µg/m³</span>
            </div>
            <input
              type="range"
              aria-label="Hypothetical PM2.5 slider"
              min={10}
              max={300}
              value={state.pm25Override}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'pm25Override', value: Number(e.target.value) })
              }
              className="w-full accent-[#263C32] cursor-pointer"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs font-medium text-[#252D28] pt-1">
          <input
            type="checkbox"
            checked={state.usePm10Override}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'usePm10Override', value: e.target.checked })
            }
            className="accent-[#263C32]"
          />
          <span>{t(lang, 'ui_pm10_override')}</span>
        </label>
        {state.usePm10Override && (
          <div className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-1.5">
            <div className="flex justify-between text-xs font-mono tabular-nums">
              <span className="text-[#89918A]">PM10</span>
              <span className="font-semibold text-[#263C32]">{state.pm10Override} µg/m³</span>
            </div>
            <input
              type="range"
              aria-label={t(lang, 'ui_pm10_override')}
              min={20}
              max={500}
              value={state.pm10Override}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'pm10Override', value: Number(e.target.value) })
              }
              className="w-full accent-[#263C32] cursor-pointer"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-xs font-medium text-[#252D28] pt-1">
          <input
            type="checkbox"
            checked={state.useAqiOverride}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'useAqiOverride', value: e.target.checked })
            }
            className="accent-[#263C32]"
          />
          <span>{t(lang, 'ui_aqi_override')}</span>
        </label>
        {state.useAqiOverride && (
          <div className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-1.5">
            <div className="flex justify-between text-xs font-mono tabular-nums">
              <span className="text-[#89918A]">India NAQI</span>
              <span className="font-semibold text-[#263C32]">{state.aqiOverride}</span>
            </div>
            <input
              type="range"
              aria-label={t(lang, 'ui_aqi_override')}
              min={15}
              max={450}
              value={state.aqiOverride}
              onChange={(e) =>
                dispatch({ type: 'setField', field: 'aqiOverride', value: Number(e.target.value) })
              }
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
          value={state.forecastTrendOverride}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'forecastTrendOverride',
              value: e.target.value as 'none' | 'improving' | 'stable' | 'worsening',
            })
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
              checked={state.applyRoutineOverride}
              onChange={(e) =>
                dispatch({
                  type: 'setField',
                  field: 'applyRoutineOverride',
                  value: e.target.checked,
                })
              }
              className="accent-[#263C32]"
            />
            <span>Modify a Routine</span>
          </label>
          {state.applyRoutineOverride && (
            <div className="space-y-2">
              <select
                aria-label="Select routine to override"
                value={state.overrideRoutineId}
                onChange={(e) =>
                  dispatch({
                    type: 'setField',
                    field: 'overrideRoutineId',
                    value: e.target.value,
                  })
                }
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
                  value={state.overrideEnvironment}
                  onChange={(e) =>
                    dispatch({
                      type: 'setField',
                      field: 'overrideEnvironment',
                      value: e.target.value as 'outdoor' | 'indoor',
                    })
                  }
                  className="px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
                >
                  <option value="indoor">{t(lang, 'env_indoor')}</option>
                  <option value="outdoor">{t(lang, 'env_outdoor')}</option>
                </select>
                <select
                  aria-label="Override time window"
                  value={state.overrideWindow}
                  onChange={(e) =>
                    dispatch({
                      type: 'setField',
                      field: 'overrideWindow',
                      value: e.target.value as TimeWindow,
                    })
                  }
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
            checked={state.simulateStale}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'simulateStale', value: e.target.checked })
            }
            className="accent-[#263C32]"
          />
          <span>Simulate Stale Sensor (&gt; 6h)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.simulateUnavailable}
            onChange={(e) =>
              dispatch({
                type: 'setField',
                field: 'simulateUnavailable',
                value: e.target.checked,
              })
            }
            className="accent-[#263C32]"
          />
          <span>Simulate Data Unavailable</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={state.running}
        className="w-full px-4 py-2.5 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
      >
        {t(lang, 'action_runScenario')}
      </button>
    </form>
  );
}
