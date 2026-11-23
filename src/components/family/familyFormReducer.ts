import type {
  ActivityPreference,
  AgeGroup,
  FamilyMember,
  HouseholdProfile,
  LanguageCode,
  SensitivityTag,
} from '../../shared/types';

export interface FamilyFormState {
  mode: 'members' | 'guided';
  step: 1 | 2 | 3;
  hhName: string;
  city: string;
  cityQuery: string;
  locality: string;
  language: LanguageCode;
  sensitivityTags: SensitivityTag[];
  savingHh: boolean;
  feedback: string | null;
  newName: string;
  newAgeGroup: AgeGroup;
  newPref: ActivityPreference;
  newFlex: 'fixed' | 'flexible';
  addingMember: boolean;
  editingMemberId: string | null;
  editName: string;
  editAgeGroup: AgeGroup;
  editPref: ActivityPreference;
  editFlex: 'fixed' | 'flexible';
  savingMemberEdit: boolean;
}

export type FamilyFormAction =
  | { type: 'setMode'; mode: 'members' | 'guided'; step?: 1 | 2 | 3 }
  | { type: 'setStep'; step: 1 | 2 | 3 }
  | {
      type: 'setField';
      field: keyof FamilyFormState;
      value: FamilyFormState[keyof FamilyFormState];
    }
  | { type: 'toggleSensitivityTag'; tag: SensitivityTag }
  | { type: 'startEditMember'; member: FamilyMember }
  | { type: 'cancelEditMember' };

export function createInitialFamilyState(
  household: HouseholdProfile,
  initialMode: 'members' | 'guided'
): FamilyFormState {
  return {
    mode: initialMode,
    step: 1,
    hhName: household.name,
    city: household.city,
    cityQuery: '',
    locality: household.locality ?? '',
    language: household.language,
    sensitivityTags: household.sensitivityTags ?? [],
    savingHh: false,
    feedback: null,
    newName: '',
    newAgeGroup: 'school_child',
    newPref: 'outdoor_play',
    newFlex: 'flexible',
    addingMember: false,
    editingMemberId: null,
    editName: '',
    editAgeGroup: 'adult',
    editPref: 'commute',
    editFlex: 'fixed',
    savingMemberEdit: false,
  };
}

export function familyFormReducer(
  state: FamilyFormState,
  action: FamilyFormAction
): FamilyFormState {
  switch (action.type) {
    case 'setMode':
      return { ...state, mode: action.mode, step: action.step ?? state.step };
    case 'setStep':
      return { ...state, step: action.step };
    case 'setField':
      return { ...state, [action.field]: action.value };
    case 'toggleSensitivityTag': {
      const exists = state.sensitivityTags.includes(action.tag);
      return {
        ...state,
        sensitivityTags: exists
          ? state.sensitivityTags.filter((item) => item !== action.tag)
          : [...state.sensitivityTags, action.tag],
      };
    }
    case 'startEditMember':
      return {
        ...state,
        editingMemberId: action.member.id,
        editName: action.member.name,
        editAgeGroup: action.member.ageGroup,
        editPref: action.member.activityPreference,
        editFlex: action.member.routineFlexibility,
      };
    case 'cancelEditMember':
      return { ...state, editingMemberId: null };
  }
}
