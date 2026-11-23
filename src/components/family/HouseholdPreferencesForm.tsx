import type { Dispatch } from 'react';
import type { LanguageCode, SensitivityTag } from '../../shared/types';
import type { IndianCityEntry } from '../../shared/indianCities';
import { t } from '../../i18n/translations';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';

const SENSITIVITY_OPTIONS: SensitivityTag[] = [
  'dust_sensitive',
  'respiratory_comfort',
  'high_outdoor_exertion',
  'elder_mobility_care',
  'early_commute_exposure',
];

interface HouseholdPreferencesFormProps {
  lang: LanguageCode;
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  matchedCities: IndianCityEntry[];
  selectedCityMeta: IndianCityEntry | undefined;
  onSubmit: (e: React.FormEvent) => void;
}

export function HouseholdPreferencesForm({
  lang,
  state,
  dispatch,
  matchedCities,
  selectedCityMeta,
  onSubmit,
}: HouseholdPreferencesFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="lg:col-span-4 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
    >
      <h2 className="font-display text-sm font-semibold text-[#252D28]">
        {t(lang, 'tab_preferences')}
      </h2>
      <div>
        <label htmlFor="hh-label-input" className="block text-xs text-[#565F58] mb-1">
          Household Label
        </label>
        <input
          id="hh-label-input"
          type="text"
          required
          value={state.hhName}
          onChange={(e) => dispatch({ type: 'setField', field: 'hhName', value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        />
      </div>
      <div>
        <label htmlFor="hh-city-search" className="block text-xs text-[#565F58] mb-1">
          {t(lang, 'ui_location_label')}
        </label>
        <input
          id="hh-city-search"
          type="text"
          value={state.cityQuery}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'cityQuery', value: e.target.value })
          }
          placeholder={t(lang, 'ui_search_city_placeholder')}
          className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg mb-2"
        />
        <select
          aria-label={t(lang, 'ui_location_label')}
          value={state.city}
          onChange={(e) => dispatch({ type: 'setField', field: 'city', value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        >
          {!matchedCities.some((c) => c.canonicalName === state.city) && state.city && (
            <option value={state.city}>{state.city}</option>
          )}
          {matchedCities.map((c) => (
            <option key={c.canonicalName} value={c.canonicalName}>
              {c.canonicalName} ({c.state})
            </option>
          ))}
        </select>
        {selectedCityMeta?.disambiguationNote && (
          <p className="mt-1 text-[11px] text-[#565F58]">{selectedCityMeta.disambiguationNote}</p>
        )}
      </div>
      <div>
        <label htmlFor="hh-locality-input" className="block text-xs text-[#565F58] mb-1">
          {t(lang, 'ui_locality_optional')}
        </label>
        <input
          id="hh-locality-input"
          type="text"
          value={state.locality}
          onChange={(e) => dispatch({ type: 'setField', field: 'locality', value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        />
      </div>

      <div className="pt-3 border-t border-[#E2E7E1] space-y-2">
        <p className="text-xs font-semibold text-[#252D28]">
          {t(lang, 'ui_sensitivity_tags_title')}
        </p>
        <p className="text-[11px] text-[#565F58] leading-relaxed">
          {t(lang, 'ui_sensitivity_tags_desc')}
        </p>
        <div className="space-y-1.5 pt-1">
          {SENSITIVITY_OPTIONS.map((tag) => {
            const checked = state.sensitivityTags.includes(tag);
            return (
              <label
                key={tag}
                className="flex items-center gap-2 text-xs text-[#252D28] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => dispatch({ type: 'toggleSensitivityTag', tag })}
                  className="accent-[#263C32] rounded"
                />
                <span>{t(lang, `sens_${tag}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={state.savingHh}
        className="w-full px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
      >
        {t(lang, 'action_save')}
      </button>
    </form>
  );
}
