import { X } from 'lucide-react';
import type { Dispatch } from 'react';
import type { ActivityPreference, AgeGroup, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';

interface MemberEditFormProps {
  lang: LanguageCode;
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  onSaveEditMember: (e: React.FormEvent) => void;
}

export function MemberEditForm({ lang, state, dispatch, onSaveEditMember }: MemberEditFormProps) {
  return (
    <form onSubmit={onSaveEditMember} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#263C32]">{t(lang, 'ui_edit_member')}</span>
        <button
          type="button"
          onClick={() => dispatch({ type: 'cancelEditMember' })}
          aria-label={t(lang, 'action_close')}
          className="p-1 text-[#565F58] hover:text-[#252D28] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        type="text"
        required
        aria-label="Edit member name"
        value={state.editName}
        onChange={(e) => dispatch({ type: 'setField', field: 'editName', value: e.target.value })}
        className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
      />
      <div className="grid grid-cols-1 gap-2">
        <select
          aria-label="Edit age group"
          value={state.editAgeGroup}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'editAgeGroup',
              value: e.target.value as AgeGroup,
            })
          }
          className="px-2.5 py-1.5 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        >
          <option value="infant_toddler">{t(lang, 'age_infant_toddler')}</option>
          <option value="school_child">{t(lang, 'age_school_child')}</option>
          <option value="adult">{t(lang, 'age_adult')}</option>
          <option value="older_adult">{t(lang, 'age_older_adult')}</option>
        </select>
        <select
          aria-label="Edit primary activity"
          value={state.editPref}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'editPref',
              value: e.target.value as ActivityPreference,
            })
          }
          className="px-2.5 py-1.5 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        >
          <option value="outdoor_play">{t(lang, 'pref_outdoor_play')}</option>
          <option value="morning_walk">{t(lang, 'pref_morning_walk')}</option>
          <option value="outdoor_exercise">{t(lang, 'pref_outdoor_exercise')}</option>
          <option value="commute">{t(lang, 'pref_commute')}</option>
          <option value="mostly_indoors">{t(lang, 'pref_mostly_indoors')}</option>
        </select>
        <select
          aria-label="Edit routine flexibility"
          value={state.editFlex}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'editFlex',
              value: e.target.value as 'fixed' | 'flexible',
            })
          }
          className="px-2.5 py-1.5 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        >
          <option value="flexible">{t(lang, 'flex_flexible')}</option>
          <option value="fixed">{t(lang, 'flex_fixed')}</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={state.savingMemberEdit}
          className="flex-1 py-1.5 text-xs font-medium bg-[#263C32] text-white rounded-lg cursor-pointer"
        >
          {t(lang, 'action_save_edit')}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'cancelEditMember' })}
          className="px-3 py-1.5 text-xs border border-[#E2E7E1] rounded-lg cursor-pointer"
        >
          {t(lang, 'action_cancel')}
        </button>
      </div>
    </form>
  );
}
