import { Pencil, Star, Trash2, X } from 'lucide-react';
import type { Dispatch } from 'react';
import type { LanguageCode, LocationInput, SavedLocation } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { LocationsFormAction, LocationsFormState } from './locationsFormReducer';

interface SavedLocationRowProps {
  lang: LanguageCode;
  loc: SavedLocation;
  canDelete: boolean;
  state: LocationsFormState;
  dispatch: Dispatch<LocationsFormAction>;
  onSaveEdit: (loc: SavedLocation) => Promise<void>;
  onUpdateLocation: (id: string, input: LocationInput) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
}

export function SavedLocationRow({
  lang,
  loc,
  canDelete,
  state,
  dispatch,
  onSaveEdit,
  onUpdateLocation,
  onDeleteLocation,
}: SavedLocationRowProps) {
  const isEditing = state.editingId === loc.id;

  return (
    <div className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      {isEditing ? (
        <div className="flex-1 flex flex-wrap items-center gap-2">
          <input
            type="text"
            aria-label={t(lang, 'ui_location_label_input')}
            value={state.editLabel}
            onChange={(e) => dispatch({ type: 'set', field: 'editLabel', value: e.target.value })}
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
            onClick={() => void onSaveEdit(loc)}
            className="px-3 py-1.5 bg-[#263C32] text-white rounded-lg cursor-pointer"
          >
            {t(lang, 'action_save_edit')}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'set', field: 'editingId', value: null })}
            aria-label={t(lang, 'action_close')}
            className="p-1.5 text-[#565F58] cursor-pointer"
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
            <p className="text-[#565F58]">
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
              className="p-1.5 rounded-lg text-[#565F58] hover:text-[#263C32] hover:bg-white cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={() => void onDeleteLocation(loc.id)}
                aria-label={`${t(lang, 'action_delete')} ${loc.label}`}
                className="p-1.5 rounded-lg text-[#565F58] hover:text-[#B33A2E] hover:bg-white cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
