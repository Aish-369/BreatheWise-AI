import { SlidersHorizontal } from 'lucide-react';
import type { Dispatch } from 'react';
import type { ActivityRoutine, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { SimulatorAction, SimulatorState } from './simulatorReducer';
import { OverrideSlidersSection } from './OverrideSlidersSection';
import { RoutineOverrideSection } from './RoutineOverrideSection';

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
        <SlidersHorizontal className="w-4 h-4 text-[#4D6B50]" strokeWidth={1.8} />
        <span>Scenario Parameters</span>
      </h2>

      <div>
        <label htmlFor="sim-label-input" className="block text-xs text-[#565F58] mb-1">
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

      <OverrideSlidersSection lang={lang} state={state} dispatch={dispatch} />

      <div className="border-t border-[#E2E7E1] pt-4">
        <label htmlFor="sim-forecast-trend" className="block text-xs text-[#565F58] mb-1">
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

      <RoutineOverrideSection lang={lang} routines={routines} state={state} dispatch={dispatch} />

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
