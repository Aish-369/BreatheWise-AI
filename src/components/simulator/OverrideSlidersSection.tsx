import type { Dispatch } from 'react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { SimulatorAction, SimulatorState } from './simulatorReducer';

function previewBandForPm25(pm25: number): string {
  if (pm25 <= 30) return 'Good';
  if (pm25 <= 60) return 'Satisfactory';
  if (pm25 <= 90) return 'Moderate';
  if (pm25 <= 120) return 'Poor';
  if (pm25 <= 250) return 'Very Poor';
  return 'Severe';
}

interface OverrideSlidersSectionProps {
  lang: LanguageCode;
  state: SimulatorState;
  dispatch: Dispatch<SimulatorAction>;
}

export function OverrideSlidersSection({ lang, state, dispatch }: OverrideSlidersSectionProps) {
  return (
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
            <span className="text-[#565F58]">
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
            <span className="text-[#565F58]">PM10</span>
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
            <span className="text-[#565F58]">India NAQI</span>
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
  );
}
