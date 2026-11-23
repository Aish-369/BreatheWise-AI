import { useReducer } from 'react';
import type {
  FamilyMember,
  FamilyMemberInput,
  HouseholdInput,
  HouseholdProfile,
  LanguageCode,
} from '../shared/types';
import { findCityMetadata, searchIndianCities } from '../shared/indianCities';
import { createInitialFamilyState, familyFormReducer } from './family/familyFormReducer';
import { FamilyViewBody, formatSavedMessage } from './family/FamilyViewBody';

interface FamilyOnboardingViewProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  members: FamilyMember[];
  initialMode?: 'members' | 'guided';
  onSaveHousehold: (input: HouseholdInput) => Promise<void>;
  onAddMember: (input: FamilyMemberInput) => Promise<void>;
  onUpdateMember: (memberId: string, input: FamilyMemberInput) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
  onDoneOnboarding: () => void;
}

export function FamilyOnboardingView({
  lang,
  household,
  members,
  initialMode = 'members',
  onSaveHousehold,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onDoneOnboarding,
}: FamilyOnboardingViewProps) {
  const [state, dispatch] = useReducer(familyFormReducer, { household, initialMode }, (init) =>
    createInitialFamilyState(init.household, init.initialMode)
  );
  const matchedCities = searchIndianCities(state.cityQuery);
  const selectedCityMeta = findCityMetadata(state.city);

  const handleSaveHousehold = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    dispatch({ type: 'setField', field: 'savingHh', value: true });
    dispatch({ type: 'setField', field: 'feedback', value: null });
    try {
      await onSaveHousehold({
        name: state.hhName.trim() || 'Local Household',
        city: state.city.trim() || 'Pune',
        locality: state.locality.trim(),
        language: state.language,
        sensitivityTags: state.sensitivityTags,
      });
      dispatch({ type: 'setField', field: 'feedback', value: formatSavedMessage(lang) });
      if (state.mode === 'guided' && state.step === 1) {
        dispatch({ type: 'setStep', step: 2 });
      }
    } finally {
      dispatch({ type: 'setField', field: 'savingHh', value: false });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = state.newName.trim();
    if (!trimmed) return;
    dispatch({ type: 'setField', field: 'addingMember', value: true });
    dispatch({ type: 'setField', field: 'feedback', value: null });
    try {
      await onAddMember({
        name: trimmed,
        ageGroup: state.newAgeGroup,
        activityPreference: state.newPref,
        routineFlexibility: state.newFlex,
      });
      dispatch({ type: 'setField', field: 'newName', value: '' });
      dispatch({ type: 'setField', field: 'feedback', value: `${trimmed} added.` });
    } finally {
      dispatch({ type: 'setField', field: 'addingMember', value: false });
    }
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.editingMemberId || !state.editName.trim()) return;
    dispatch({ type: 'setField', field: 'savingMemberEdit', value: true });
    try {
      await onUpdateMember(state.editingMemberId, {
        name: state.editName.trim(),
        ageGroup: state.editAgeGroup,
        activityPreference: state.editPref,
        routineFlexibility: state.editFlex,
      });
      dispatch({ type: 'cancelEditMember' });
    } finally {
      dispatch({ type: 'setField', field: 'savingMemberEdit', value: false });
    }
  };

  return (
    <FamilyViewBody
      lang={lang}
      household={household}
      members={members}
      state={state}
      dispatch={dispatch}
      matchedCities={matchedCities}
      selectedCityMeta={selectedCityMeta ?? undefined}
      onSaveHousehold={(e) => void handleSaveHousehold(e)}
      onAddMember={(e) => void handleAddMember(e)}
      onSaveEditMember={(e) => void handleSaveEditMember(e)}
      onDeleteMember={onDeleteMember}
      onDoneOnboarding={onDoneOnboarding}
    />
  );
}
