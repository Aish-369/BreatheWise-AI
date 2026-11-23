import type { Dispatch } from 'react';
import type { FamilyMember, HouseholdProfile, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';
import { FamilyOverviewBanner } from './FamilyOverviewBanner';
import { FamilyViewHeader } from './FamilyViewHeader';
import { GuidedOnboardingWizard } from './GuidedOnboardingWizard';
import { HouseholdPreferencesForm } from './HouseholdPreferencesForm';
import { MemberProfileCard } from './MemberProfileCard';
import { AddMemberForm } from './AddMemberForm';
import type { IndianCityEntry } from '../../shared/indianCities';

interface FamilyViewBodyProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  members: FamilyMember[];
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  matchedCities: IndianCityEntry[];
  selectedCityMeta: IndianCityEntry | undefined;
  onSaveHousehold: (e: React.FormEvent) => void;
  onAddMember: (e: React.FormEvent) => void;
  onSaveEditMember: (e: React.FormEvent) => void;
  onDeleteMember: (memberId: string) => Promise<void>;
  onDoneOnboarding: () => void;
}

export function FamilyViewBody(props: FamilyViewBodyProps) {
  const { lang, household, members, state, dispatch } = props;
  const flexibleCount = members.filter((m) => m.routineFlexibility === 'flexible').length;

  return (
    <div className="space-y-7">
      <FamilyViewHeader
        lang={lang}
        mode={state.mode}
        onSelectMode={(mode) =>
          dispatch(
            mode === 'guided'
              ? { type: 'setMode', mode: 'guided', step: 1 }
              : { type: 'setMode', mode: 'members' }
          )
        }
      />

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
          matchedCities={props.matchedCities}
          selectedCityMeta={props.selectedCityMeta}
          onSaveHousehold={props.onSaveHousehold}
          onAddMember={props.onAddMember}
          onDeleteMember={props.onDeleteMember}
          onDoneOnboarding={props.onDoneOnboarding}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <HouseholdPreferencesForm
            lang={lang}
            state={state}
            dispatch={dispatch}
            matchedCities={props.matchedCities}
            selectedCityMeta={props.selectedCityMeta}
            onSubmit={props.onSaveHousehold}
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
                  onSaveEditMember={props.onSaveEditMember}
                  onDeleteMember={props.onDeleteMember}
                />
              ))}
            </div>
            <AddMemberForm
              lang={lang}
              state={state}
              dispatch={dispatch}
              onSubmit={props.onAddMember}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function formatSavedMessage(lang: LanguageCode): string {
  return `${t(lang, 'action_save')} ✓`;
}
