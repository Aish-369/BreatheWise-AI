import { Plus } from 'lucide-react';
import type { Dispatch } from 'react';
import type { LanguageCode } from '../../shared/types';
import { findCityMetadata, searchIndianCities } from '../../shared/indianCities';
import { t } from '../../i18n/translations';
import type { LocationsFormAction, LocationsFormState } from './locationsFormReducer';

interface AddLocationFormProps {
  lang: LanguageCode;
  state: LocationsFormState;
  dispatch: Dispatch<LocationsFormAction>;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddLocationForm({ lang, state, dispatch, onSubmit }: AddLocationFormProps) {
  const matchedCities = searchIndianCities(state.cityQuery);
  const selectedCityMeta = findCityMetadata(state.selectedCity);

  return (
    <form
      onSubmit={onSubmit}
      className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-3.5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
    >
      <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
        <Plus className="w-4 h-4 text-[#4D6B50]" />
        <span>{t(lang, 'ui_add_location_title')}</span>
      </h2>
      <div>
        <input
          type="text"
          aria-label={t(lang, 'ui_search_city_placeholder')}
          value={state.cityQuery}
          onChange={(e) => dispatch({ type: 'set', field: 'cityQuery', value: e.target.value })}
          placeholder={t(lang, 'ui_search_city_placeholder')}
          className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg mb-2"
        />
        <select
          aria-label={t(lang, 'ui_location_label')}
          value={state.selectedCity}
          onChange={(e) => dispatch({ type: 'set', field: 'selectedCity', value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        >
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
      <input
        type="text"
        aria-label={t(lang, 'ui_location_label_input')}
        value={state.locLabel}
        onChange={(e) => dispatch({ type: 'set', field: 'locLabel', value: e.target.value })}
        placeholder={t(lang, 'ui_location_label_input')}
        className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
      />
      <input
        type="text"
        aria-label={t(lang, 'ui_locality_optional')}
        value={state.locality}
        onChange={(e) => dispatch({ type: 'set', field: 'locality', value: e.target.value })}
        placeholder={t(lang, 'ui_locality_optional')}
        className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
      />
      <label className="flex items-center gap-2 text-xs text-[#252D28] cursor-pointer">
        <input
          type="checkbox"
          checked={state.isPrimary}
          onChange={(e) => dispatch({ type: 'set', field: 'isPrimary', value: e.target.checked })}
          className="accent-[#263C32]"
        />
        <span>{t(lang, 'action_set_primary')}</span>
      </label>
      <button
        type="submit"
        disabled={state.savingLoc}
        className="w-full py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
      >
        {t(lang, 'action_add')}
      </button>
    </form>
  );
}
