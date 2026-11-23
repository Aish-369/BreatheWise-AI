import { useReducer } from 'react';
import { Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import type { LanguageCode, LocationInput, SavedLocation } from '../../shared/types';
import { findCityMetadata, searchIndianCities } from '../../shared/indianCities';
import { t } from '../../i18n/translations';

interface SavedLocationsPanelProps {
  lang: LanguageCode;
  locations: SavedLocation[];
  onCreateLocation: (input: LocationInput) => Promise<void>;
  onUpdateLocation: (id: string, input: LocationInput) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
}

interface LocationsFormState {
  cityQuery: string;
  selectedCity: string;
  locLabel: string;
  locality: string;
  isPrimary: boolean;
  savingLoc: boolean;
  editingId: string | null;
  editLabel: string;
  editLocality: string;
}

type LocationsFormAction =
  | {
      type: 'set';
      field: keyof LocationsFormState;
      value: LocationsFormState[keyof LocationsFormState];
    }
  | { type: 'startEdit'; loc: SavedLocation }
  | { type: 'resetAdd' };

const INITIAL_STATE: LocationsFormState = {
  cityQuery: '',
  selectedCity: 'Mumbai',
  locLabel: '',
  locality: '',
  isPrimary: false,
  savingLoc: false,
  editingId: null,
  editLabel: '',
  editLocality: '',
};

function reducer(state: LocationsFormState, action: LocationsFormAction): LocationsFormState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.field]: action.value };
    case 'startEdit':
      return {
        ...state,
        editingId: action.loc.id,
        editLabel: action.loc.label,
        editLocality: action.loc.locality,
      };
    case 'resetAdd':
      return { ...state, locLabel: '', locality: '', isPrimary: false };
  }
}

export function SavedLocationsPanel({
  lang,
  locations,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
}: SavedLocationsPanelProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const matchedCities = searchIndianCities(state.cityQuery);
  const selectedCityMeta = findCityMetadata(state.selectedCity);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.selectedCity.trim()) return;
    dispatch({ type: 'set', field: 'savingLoc', value: true });
    try {
      const meta = findCityMetadata(state.selectedCity);
      await onCreateLocation({
        city: state.selectedCity.trim(),
        locality: state.locality.trim(),
        label: state.locLabel.trim() || state.selectedCity.trim(),
        isPrimary: state.isPrimary,
        latitude: meta?.latitude ?? null,
        longitude: meta?.longitude ?? null,
      });
      dispatch({ type: 'resetAdd' });
    } finally {
      dispatch({ type: 'set', field: 'savingLoc', value: false });
    }
  };

  const handleSaveEdit = async (loc: SavedLocation) => {
    dispatch({ type: 'set', field: 'savingLoc', value: true });
    try {
      await onUpdateLocation(loc.id, {
        city: loc.city,
        locality: state.editLocality.trim(),
        label: state.editLabel.trim() || loc.label,
        isPrimary: loc.isPrimary,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      dispatch({ type: 'set', field: 'editingId', value: null });
    } finally {
      dispatch({ type: 'set', field: 'savingLoc', value: false });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            {t(lang, 'ui_saved_locations_title')} ({locations.length})
          </h2>
        </div>
        <div className="space-y-2.5">
          {locations.map((loc) => {
            const isEditing = state.editingId === loc.id;
            return (
              <div
                key={loc.id}
                className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {isEditing ? (
                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      aria-label={t(lang, 'ui_location_label_input')}
                      value={state.editLabel}
                      onChange={(e) =>
                        dispatch({ type: 'set', field: 'editLabel', value: e.target.value })
                      }
                      className="px-2.5 py-1.5 bg-white border border-[#E2E7E1] rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      aria-label={t(lang, 'ui_locality_optional')}
                      value={state.editLocality}
                      onChange={(e) =>
                        dispatch({ type: 'set', field: 'editLocality', value: e.target.value })
                      }
                      placeholder={t(lang, 'ui_locality_optional')}
                      className="px-2.5 py-1.5 bg-white border border-[#E2E7E1] rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      disabled={state.savingLoc}
                      onClick={() => void handleSaveEdit(loc)}
                      className="px-3 py-1.5 bg-[#263C32] text-white rounded-lg cursor-pointer"
                    >
                      {t(lang, 'action_save_edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'set', field: 'editingId', value: null })}
                      aria-label={t(lang, 'action_close')}
                      className="p-1.5 text-[#89918A] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold text-[#252D28] flex items-center gap-1.5">
                        <span>{loc.label}</span>
                        {loc.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#263C32] text-white text-[10px]">
                            <Star className="w-2.5 h-2.5" /> Primary
                          </span>
                        )}
                      </p>
                      <p className="text-[#89918A]">
                        {loc.city}
                        {loc.locality ? ` · ${loc.locality}` : ''}
                        {loc.latitude !== null && loc.longitude !== null
                          ? ` · (${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)})`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!loc.isPrimary && (
                        <button
                          type="button"
                          onClick={() =>
                            void onUpdateLocation(loc.id, {
                              city: loc.city,
                              locality: loc.locality,
                              label: loc.label,
                              isPrimary: true,
                              latitude: loc.latitude,
                              longitude: loc.longitude,
                            })
                          }
                          className="px-2.5 py-1 rounded-md border border-[#E2E7E1] bg-white text-[#263C32] hover:bg-[#DCE9DD]/45 cursor-pointer"
                        >
                          {t(lang, 'action_set_primary')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'startEdit', loc })}
                        aria-label={`${t(lang, 'action_edit')} ${loc.label}`}
                        className="p-1.5 rounded-lg text-[#89918A] hover:text-[#263C32] hover:bg-white cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {locations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => void onDeleteLocation(loc.id)}
                          aria-label={`${t(lang, 'action_delete')} ${loc.label}`}
                          className="p-1.5 rounded-lg text-[#89918A] hover:text-[#B33A2E] hover:bg-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={(e) => void handleAddLocation(e)}
        className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-3.5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
      >
        <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#829C83]" />
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
            onChange={(e) =>
              dispatch({ type: 'set', field: 'selectedCity', value: e.target.value })
            }
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          >
            {matchedCities.map((c) => (
              <option key={c.canonicalName} value={c.canonicalName}>
                {c.canonicalName} ({c.state})
              </option>
            ))}
          </select>
          {selectedCityMeta?.disambiguationNote && (
            <p className="mt-1 text-[11px] text-[#89918A]">{selectedCityMeta.disambiguationNote}</p>
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
    </div>
  );
}
