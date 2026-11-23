import { useReducer } from 'react';
import type { LanguageCode, LocationInput, SavedLocation } from '../../shared/types';
import { findCityMetadata } from '../../shared/indianCities';
import { t } from '../../i18n/translations';
import { INITIAL_LOCATIONS_STATE, locationsFormReducer } from './locationsFormReducer';
import { SavedLocationRow } from './SavedLocationRow';
import { AddLocationForm } from './AddLocationForm';

interface SavedLocationsPanelProps {
  lang: LanguageCode;
  locations: SavedLocation[];
  onCreateLocation: (input: LocationInput) => Promise<void>;
  onUpdateLocation: (id: string, input: LocationInput) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
}

export function SavedLocationsPanel({
  lang,
  locations,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
}: SavedLocationsPanelProps) {
  const [state, dispatch] = useReducer(locationsFormReducer, INITIAL_LOCATIONS_STATE);

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
          {locations.map((loc) => (
            <SavedLocationRow
              key={loc.id}
              lang={lang}
              loc={loc}
              canDelete={locations.length > 1}
              state={state}
              dispatch={dispatch}
              onSaveEdit={handleSaveEdit}
              onUpdateLocation={onUpdateLocation}
              onDeleteLocation={onDeleteLocation}
            />
          ))}
        </div>
      </div>

      <AddLocationForm
        lang={lang}
        state={state}
        dispatch={dispatch}
        onSubmit={(e) => void handleAddLocation(e)}
      />
    </div>
  );
}
