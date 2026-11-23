import { ArrowRight, Check, Trash2 } from 'lucide-react';
import type { Dispatch } from 'react';
import type { AgeGroup, FamilyMember, LanguageCode } from '../../shared/types';
import type { IndianCityEntry } from '../../shared/indianCities';
import { t } from '../../i18n/translations';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';

interface StepOneProps {
  lang: LanguageCode;
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  matchedCities: IndianCityEntry[];
  selectedCityMeta: IndianCityEntry | undefined;
  onSaveHousehold: (e: React.FormEvent) => void;
}

export function WizardStepOneForm({
  lang,
  state,
  dispatch,
  matchedCities,
  selectedCityMeta,
  onSaveHousehold,
}: StepOneProps) {
  return (
    <form onSubmit={onSaveHousehold} className="space-y-4">
      <div>
        <label htmlFor="guided-hh-name" className="block text-xs font-medium text-[#565F58] mb-1">
          Household Name
        </label>
        <input
          id="guided-hh-name"
          type="text"
          required
          value={state.hhName}
          onChange={(e) => dispatch({ type: 'setField', field: 'hhName', value: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg text-[#252D28]"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="guided-city-search"
            className="block text-xs font-medium text-[#565F58] mb-1"
          >
            {t(lang, 'ui_location_label')}
          </label>
          <input
            id="guided-city-search"
            type="text"
            value={state.cityQuery}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'cityQuery', value: e.target.value })
            }
            placeholder={t(lang, 'ui_search_city_placeholder')}
            className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg mb-2"
          />
          <select
            aria-label={t(lang, 'ui_location_label')}
            value={state.city}
            onChange={(e) => dispatch({ type: 'setField', field: 'city', value: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg text-[#252D28]"
          >
            {!matchedCities.some((c) => c.canonicalName === state.city) && state.city && (
              <option value={state.city}>{state.city}</option>
            )}
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
        <div>
          <label htmlFor="guided-lang" className="block text-xs font-medium text-[#565F58] mb-1">
            Language
          </label>
          <select
            id="guided-lang"
            value={state.language}
            onChange={(e) =>
              dispatch({
                type: 'setField',
                field: 'language',
                value: e.target.value as LanguageCode,
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg text-[#252D28]"
          >
            <option value="en">English</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={state.savingHh}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
      >
        <span>{t(lang, 'action_save')}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

interface StepTwoProps {
  lang: LanguageCode;
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  members: FamilyMember[];
  onAddMember: (e: React.FormEvent) => void;
  onDeleteMember: (memberId: string) => Promise<void>;
}

export function WizardStepTwoMembers({
  lang,
  state,
  dispatch,
  members,
  onAddMember,
  onDeleteMember,
}: StepTwoProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] flex items-center justify-between text-xs"
          >
            <div>
              <p className="font-semibold text-[#252D28]">{m.name}</p>
              <p className="text-[#565F58]">
                {t(lang, `age_${m.ageGroup}`)} · {t(lang, `pref_${m.activityPreference}`)}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Remove ${m.name}`}
              onClick={() => void onDeleteMember(m.id)}
              className="text-[#565F58] hover:text-[#B33A2E] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={onAddMember} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          required
          aria-label="Member name"
          value={state.newName}
          onChange={(e) => dispatch({ type: 'setField', field: 'newName', value: e.target.value })}
          placeholder="Member name"
          className="px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        />
        <select
          aria-label="Age group"
          value={state.newAgeGroup}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'newAgeGroup',
              value: e.target.value as AgeGroup,
            })
          }
          className="px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        >
          <option value="infant_toddler">{t(lang, 'age_infant_toddler')}</option>
          <option value="school_child">{t(lang, 'age_school_child')}</option>
          <option value="adult">{t(lang, 'age_adult')}</option>
          <option value="older_adult">{t(lang, 'age_older_adult')}</option>
        </select>
        <button
          type="submit"
          disabled={state.addingMember}
          className="px-4 py-2 text-xs font-medium border border-[#E2E7E1] bg-[#DCE9DD]/55 text-[#263C32] rounded-lg hover:bg-[#DCE9DD] cursor-pointer"
        >
          + {t(lang, 'action_add')}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'setStep', step: 3 })}
          className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
        >
          {t(lang, 'side_overview')} →
        </button>
      </form>
    </div>
  );
}

interface StepThreeProps {
  lang: LanguageCode;
  hhName: string;
  city: string;
  memberCount: number;
  onDoneOnboarding: () => void;
}

export function WizardStepThreeReady({
  lang,
  hhName,
  city,
  memberCount,
  onDoneOnboarding,
}: StepThreeProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[#3B6E52]">
        <Check className="w-4 h-4" />
        <span>{t(lang, 'ui_family_status_ready')}</span>
      </div>
      <p className="text-xs text-[#565F58]">
        {hhName} · {city} · {memberCount} {t(lang, 'tab_members').toLowerCase()}
      </p>
      <button
        type="button"
        onClick={onDoneOnboarding}
        className="px-5 py-2.5 text-sm font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
      >
        {t(lang, 'side_overview')}
      </button>
    </div>
  );
}
