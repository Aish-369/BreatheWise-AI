import { Baby, Footprints, GraduationCap, Pencil, Trash2, User, X } from 'lucide-react';
import type { Dispatch } from 'react';
import type { ActivityPreference, AgeGroup, FamilyMember, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';

function AgeGroupIcon({ ageGroup }: { ageGroup: AgeGroup }) {
  switch (ageGroup) {
    case 'infant_toddler':
      return <Baby className="w-3.5 h-3.5 text-[#829C83]" aria-hidden="true" />;
    case 'school_child':
      return <GraduationCap className="w-3.5 h-3.5 text-[#829C83]" aria-hidden="true" />;
    case 'older_adult':
      return <Footprints className="w-3.5 h-3.5 text-[#829C83]" aria-hidden="true" />;
    default:
      return <User className="w-3.5 h-3.5 text-[#829C83]" aria-hidden="true" />;
  }
}

interface MemberProfileCardProps {
  lang: LanguageCode;
  member: FamilyMember;
  state: FamilyFormState;
  dispatch: Dispatch<FamilyFormAction>;
  onSaveEditMember: (e: React.FormEvent) => void;
  onDeleteMember: (memberId: string) => Promise<void>;
}

export function MemberProfileCard({
  lang,
  member,
  state,
  dispatch,
  onSaveEditMember,
  onDeleteMember,
}: MemberProfileCardProps) {
  const isEditing = state.editingMemberId === member.id;

  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)] hover:border-[#829C83] transition-colors">
      {isEditing ? (
        <form onSubmit={onSaveEditMember} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#263C32]">
              {t(lang, 'ui_edit_member')}
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'cancelEditMember' })}
              aria-label={t(lang, 'action_close')}
              className="p-1 text-[#89918A] hover:text-[#252D28] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            required
            aria-label="Edit member name"
            value={state.editName}
            onChange={(e) =>
              dispatch({ type: 'setField', field: 'editName', value: e.target.value })
            }
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
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#263C32] to-[#3A594B] text-[#DCE9DD] flex items-center justify-center font-display text-sm font-bold shrink-0">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-[#252D28]">{member.name}</h3>
                <p className="text-xs text-[#89918A] flex items-center gap-1">
                  <AgeGroupIcon ageGroup={member.ageGroup} />
                  <span>{t(lang, `age_${member.ageGroup}`)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => dispatch({ type: 'startEditMember', member })}
                aria-label={`${t(lang, 'action_edit')} ${member.name}`}
                className="p-1.5 rounded-lg text-[#89918A] hover:text-[#263C32] hover:bg-[#F7F7F1] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void onDeleteMember(member.id)}
                aria-label={`Remove ${member.name}`}
                className="p-1.5 rounded-lg text-[#89918A] hover:text-[#B33A2E] hover:bg-[#F7F7F1] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E7E1] flex items-center justify-between text-xs">
            <span className="font-medium text-[#252D28]">
              {t(lang, `pref_${member.activityPreference}`)}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#F7F7F1] text-[#89918A]">
              {t(lang, `flex_${member.routineFlexibility}`)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
