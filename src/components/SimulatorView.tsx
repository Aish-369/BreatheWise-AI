import { useReducer } from 'react';
import type {
  ActivityRoutine,
  LanguageCode,
  ScenarioComparisonResult,
  ScenarioModification,
} from '../shared/types';
import { t } from '../i18n/translations';
import { createInitialSimulatorState, simulatorReducer } from './simulator/simulatorReducer';
import { ScenarioPresets } from './simulator/ScenarioPresets';
import { ScenarioParametersForm } from './simulator/ScenarioParametersForm';
import { ScenarioResultPanel } from './simulator/ScenarioResultPanel';

interface SimulatorViewProps {
  lang: LanguageCode;
  routines: ActivityRoutine[];
  currentPm25: number | null;
  currentPm10?: number | null;
  onRunScenario: (mod: ScenarioModification) => Promise<ScenarioComparisonResult>;
}

export function SimulatorView({
  lang,
  routines,
  currentPm25,
  currentPm10 = null,
  onRunScenario,
}: SimulatorViewProps) {
  const [state, dispatch] = useReducer(
    simulatorReducer,
    { routines, currentPm25, currentPm10 },
    (init) => createInitialSimulatorState(init.routines, init.currentPm25, init.currentPm10)
  );

  const runPreset = async (mod: ScenarioModification) => {
    dispatch({ type: 'applyPreset', mod });
    try {
      const res = await onRunScenario(mod);
      dispatch({ type: 'setField', field: 'result', value: res });
    } finally {
      dispatch({ type: 'setField', field: 'running', value: false });
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'setField', field: 'running', value: true });
    try {
      const mod: ScenarioModification = {
        label: state.label.trim() || 'Custom Hypothetical Scenario',
        pm25Override: state.usePmOverride && !state.simulateUnavailable ? state.pm25Override : null,
        pm10Override:
          state.usePm10Override && !state.simulateUnavailable ? state.pm10Override : null,
        aqiOverride: state.useAqiOverride && !state.simulateUnavailable ? state.aqiOverride : null,
        simulateStale: state.simulateStale,
        simulateUnavailable: state.simulateUnavailable,
        overrideRoutineId:
          state.applyRoutineOverride && state.overrideRoutineId
            ? state.overrideRoutineId
            : undefined,
        overrideEnvironment: state.applyRoutineOverride ? state.overrideEnvironment : undefined,
        overrideWindow: state.applyRoutineOverride ? state.overrideWindow : undefined,
        forecastTrendOverride: state.forecastTrendOverride,
      };
      const res = await onRunScenario(mod);
      dispatch({ type: 'setField', field: 'result', value: res });
    } finally {
      dispatch({ type: 'setField', field: 'running', value: false });
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'sim_title')}</h1>
        <p className="mt-1 text-sm text-[#565F58]">{t(lang, 'sim_subtitle')}</p>
      </div>

      <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#263C32] to-[#1D2F27] text-[#DCE9DD] font-mono text-xs font-medium tracking-wide shadow-xs">
        {t(lang, 'scenario_banner')}
      </div>

      <ScenarioPresets onSelectPreset={(mod) => void runPreset(mod)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <ScenarioParametersForm
          lang={lang}
          routines={routines}
          state={state}
          dispatch={dispatch}
          onSubmit={(e) => void handleCustomSubmit(e)}
        />
        <ScenarioResultPanel lang={lang} result={state.result} />
      </div>
    </div>
  );
}
