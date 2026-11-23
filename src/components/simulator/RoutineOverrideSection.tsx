import type { Dispatch } from 'react';
import type { ActivityRoutine, LanguageCode, TimeWindow } from '../../shared/types';
import { t } from '../../i18n/translations';
import { TIME_WINDOWS } from '../planner/plannerFormReducer';
import type { SimulatorAction, SimulatorState } from './simulatorReducer';

interface RoutineOverrideSectionProps {
  lang: LanguageCode;
  routines: ActivityRoutine[];
  state: SimulatorState;
  dispatch: Dispatch<SimulatorAction>;
}

export function RoutineOverrideSection({
  lang,
  routines,
  state,
  dispatch,
}: RoutineOverrideSectionProps) {
  return (
    <>
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
    </>
  );
}
