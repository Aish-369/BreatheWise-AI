import type {
  ActivityRoutine,
  ScenarioComparisonResult,
  ScenarioModification,
  TimeWindow,
} from '../../shared/types';

export interface SimulatorState {
  label: string;
  pm25Override: number;
  usePmOverride: boolean;
  usePm10Override: boolean;
  pm10Override: number;
  useAqiOverride: boolean;
  aqiOverride: number;
  simulateStale: boolean;
  simulateUnavailable: boolean;
  overrideRoutineId: string;
  overrideEnvironment: 'outdoor' | 'indoor';
  overrideWindow: TimeWindow;
  applyRoutineOverride: boolean;
  forecastTrendOverride: 'none' | 'improving' | 'stable' | 'worsening';
  running: boolean;
  result: ScenarioComparisonResult | null;
}

export type SimulatorAction =
  | { type: 'setField'; field: keyof SimulatorState; value: SimulatorState[keyof SimulatorState] }
  | { type: 'applyPreset'; mod: ScenarioModification };

export function createInitialSimulatorState(
  routines: ActivityRoutine[],
  currentPm25: number | null,
  currentPm10: number | null
): SimulatorState {
  return {
    label: 'Evening traffic pollution spike',
    pm25Override: currentPm25 ?? 68,
    usePmOverride: true,
    usePm10Override: false,
    pm10Override: currentPm10 ?? 140,
    useAqiOverride: false,
    aqiOverride: 180,
    simulateStale: false,
    simulateUnavailable: false,
    overrideRoutineId: routines[0]?.id ?? '',
    overrideEnvironment: 'indoor',
    overrideWindow: '12:00-16:00',
    applyRoutineOverride: false,
    forecastTrendOverride: 'none',
    running: false,
    result: null,
  };
}

export function simulatorReducer(state: SimulatorState, action: SimulatorAction): SimulatorState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value };
    case 'applyPreset':
      return {
        ...state,
        label: action.mod.label,
        usePmOverride: typeof action.mod.pm25Override === 'number' ? true : state.usePmOverride,
        pm25Override:
          typeof action.mod.pm25Override === 'number'
            ? action.mod.pm25Override
            : state.pm25Override,
        usePm10Override: typeof action.mod.pm10Override === 'number',
        pm10Override:
          typeof action.mod.pm10Override === 'number'
            ? action.mod.pm10Override
            : state.pm10Override,
        useAqiOverride: typeof action.mod.aqiOverride === 'number',
        aqiOverride:
          typeof action.mod.aqiOverride === 'number' ? action.mod.aqiOverride : state.aqiOverride,
        simulateStale: Boolean(action.mod.simulateStale),
        simulateUnavailable: Boolean(action.mod.simulateUnavailable),
        forecastTrendOverride: action.mod.forecastTrendOverride ?? 'none',
        running: true,
      };
  }
}
