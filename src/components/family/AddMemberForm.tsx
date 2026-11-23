import { UserPlus } from 'lucide-react';
import type { Dispatch } from 'react';
import type { ActivityPreference, AgeGroup, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';

interface AddMemberFormProps {
  lang: LanguageCode;
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddMemberForm({ lang, state, dispatch, onSubmit }: AddMemberFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
    >
      <h3 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-[#4D6B50]" strokeWidth={1.8} />
        <span>{t(lang, 'action_add')}</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="new-member-name" className="block text-xs text-[#565F58] mb-1">
            Name
          </label>
          <input
            id="new-member-name"
            type="text"
            required
            value={state.newName}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'newName', value: e.target.value })
            }
            placeholder="First name"
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="new-member-age" className="block text-xs text-[#565F58] mb-1">
            Age Group
          </label>
          <select
            id="new-member-age"
            value={state.newAgeGroup}
            onChange={(e) =>
              dispatch({
                type: 'setField',
                field: 'newAgeGroup',
                value: e.target.value as AgeGroup,
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          >
            <option value="infant_toddler">{t(lang, 'age_infant_toddler')}</option>
            <option value="school_child">{t(lang, 'age_school_child')}</option>
            <option value="adult">{t(lang, 'age_adult')}</option>
            <option value="older_adult">{t(lang, 'age_older_adult')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="new-member-pref" className="block text-xs text-[#565F58] mb-1">
            Primary Activity
          </label>
          <select
            id="new-member-pref"
            value={state.newPref}
            onChange={(e) =>
              dispatch({
                type: 'setField',
                field: 'newPref',
                value: e.target.value as ActivityPreference,
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          >
            <option value="outdoor_play">{t(lang, 'pref_outdoor_play')}</option>
            <option value="morning_walk">{t(lang, 'pref_morning_walk')}</option>
            <option value="outdoor_exercise">{t(lang, 'pref_outdoor_exercise')}</option>
            <option value="commute">{t(lang, 'pref_commute')}</option>
            <option value="mostly_indoors">{t(lang, 'pref_mostly_indoors')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="new-member-flex" className="block text-xs text-[#565F58] mb-1">
            Routine Flexibility
          </label>
          <select
            id="new-member-flex"
            value={state.newFlex}
            onChange={(e) =>
              dispatch({
                type: 'setField',
                field: 'newFlex',
                value: e.target.value as 'fixed' | 'flexible',
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          >
            <option value="flexible">{t(lang, 'flex_flexible')}</option>
            <option value="fixed">{t(lang, 'flex_fixed')}</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={state.addingMember}
        className="px-5 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
      >
        {t(lang, 'action_add')}
      </button>
    </form>
  );
}
