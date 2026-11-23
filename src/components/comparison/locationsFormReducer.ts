import type { SavedLocation } from '../../shared/types';

export interface LocationsFormState {
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

export type LocationsFormAction =
  | {
      type: 'set';
      field: keyof LocationsFormState;
      value: LocationsFormState[keyof LocationsFormState];
    }
  | { type: 'startEdit'; loc: SavedLocation }
  | { type: 'resetAdd' };

export const INITIAL_LOCATIONS_STATE: LocationsFormState = {
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

export function locationsFormReducer(
  state: LocationsFormState,
  action: LocationsFormAction
): LocationsFormState {
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
