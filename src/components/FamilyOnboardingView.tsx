import { useReducer } from 'react';
import type {
  FamilyMember,
  FamilyMemberInput,
  HouseholdInput,
  HouseholdProfile,
  LanguageCode,
} from '../shared/types';
import { findCityMetadata, searchIndianCities } from '../shared/indianCities';
import { t } from '../i18n/translations';
import { createInitialFamilyState, familyFormReducer } from './family/familyFormReducer';
import { FamilyOverviewBanner } from './family/FamilyOverviewBanner';
import { GuidedOnboardingWizard } from './family/GuidedOnboardingWizard';
import { HouseholdPreferencesForm } from './family/HouseholdPreferencesForm';
import { MemberProfileCard } from './family/MemberProfileCard';
import { AddMemberForm } from './family/AddMemberForm';

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
      dispatch({ type: 'setField', field: 'feedback', value: t(lang, 'action_save') + ' ✓' });
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

  const flexibleCount = members.filter((m) => m.routineFlexibility === 'flexible').length;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'onb_title')}</h1>
          <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'onb_subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => dispatch({ type: 'setMode', mode: 'members' })}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              state.mode === 'members'
                ? 'bg-[#263C32] text-white'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_members')}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'setMode', mode: 'guided', step: 1 })}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              state.mode === 'guided'
                ? 'bg-[#263C32] text-white'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_onboarding')}
          </button>
        </div>
      </div>

      <FamilyOverviewBanner
        lang={lang}
        household={household}
        memberCount={members.length}
        flexibleCount={flexibleCount}
        fixedCount={members.length - flexibleCount}
      />

      {state.feedback && (
        <div
          role="status"
          aria-live="polite"
          className="px-4 py-2.5 rounded-xl border border-[#829C83]/50 bg-[#DCE9DD]/45 text-xs font-medium text-[#263C32]"
        >
          {state.feedback}
        </div>
      )}

      {state.mode === 'guided' ? (
        <GuidedOnboardingWizard
          lang={lang}
          state={state}
          dispatch={dispatch}
          members={members}
          matchedCities={matchedCities}
          selectedCityMeta={selectedCityMeta}
          onSaveHousehold={(e) => void handleSaveHousehold(e)}
          onAddMember={(e) => void handleAddMember(e)}
          onDeleteMember={onDeleteMember}
          onDoneOnboarding={onDoneOnboarding}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <HouseholdPreferencesForm
            lang={lang}
            state={state}
            dispatch={dispatch}
            matchedCities={matchedCities}
            selectedCityMeta={selectedCityMeta}
            onSubmit={(e) => void handleSaveHousehold(e)}
          />

          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map((m) => (
                <MemberProfileCard
                  key={m.id}
                  lang={lang}
                  member={m}
                  state={state}
                  dispatch={dispatch}
                  onSaveEditMember={(e) => void handleSaveEditMember(e)}
                  onDeleteMember={onDeleteMember}
                />
              ))}
            </div>

            <AddMemberForm
              lang={lang}
              state={state}
              dispatch={dispatch}
              onSubmit={(e) => void handleAddMember(e)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
