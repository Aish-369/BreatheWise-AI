import type { Dispatch } from 'react';
import type { FamilyMember, LanguageCode } from '../../shared/types';
import type { IndianCityEntry } from '../../shared/indianCities';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';
import {
  WizardStepOneForm,
  WizardStepThreeReady,
  WizardStepTwoMembers,
} from './OnboardingWizardSteps';

interface GuidedOnboardingWizardProps {
  lang: LanguageCode;
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  members: FamilyMember[];
  matchedCities: IndianCityEntry[];
  selectedCityMeta: IndianCityEntry | undefined;
  onSaveHousehold: (e: React.FormEvent) => void;
  onAddMember: (e: React.FormEvent) => void;
  onDeleteMember: (memberId: string) => Promise<void>;
  onDoneOnboarding: () => void;
}

export function GuidedOnboardingWizard({
  lang,
  state,
  dispatch,
  members,
  matchedCities,
  selectedCityMeta,
  onSaveHousehold,
  onAddMember,
  onDeleteMember,
  onDoneOnboarding,
}: GuidedOnboardingWizardProps) {
  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 lg:p-8 max-w-2xl space-y-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="flex items-center gap-6 border-b border-[#E2E7E1] pb-4 text-xs">
        {[
          { n: 1 as const, label: '01. Location & Language' },
          { n: 2 as const, label: '02. Family Members' },
          { n: 3 as const, label: '03. Ready' },
        ].map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => dispatch({ type: 'setStep', step: s.n })}
            className={`font-medium cursor-pointer ${
              state.step === s.n
                ? 'text-[#263C32] font-semibold underline underline-offset-4'
                : 'text-[#565F58]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {state.step === 1 && (
        <WizardStepOneForm
          lang={lang}
          state={state}
          dispatch={dispatch}
          matchedCities={matchedCities}
          selectedCityMeta={selectedCityMeta}
          onSaveHousehold={onSaveHousehold}
        />
      )}

      {state.step === 2 && (
        <WizardStepTwoMembers
          lang={lang}
          state={state}
          dispatch={dispatch}
          members={members}
          onAddMember={onAddMember}
          onDeleteMember={onDeleteMember}
        />
      )}

      {state.step === 3 && (
        <WizardStepThreeReady
          lang={lang}
          hhName={state.hhName}
          city={state.city}
          memberCount={members.length}
          onDoneOnboarding={onDoneOnboarding}
        />
      )}
    </div>
  );
}
