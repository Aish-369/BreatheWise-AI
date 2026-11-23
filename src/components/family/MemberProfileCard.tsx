import { Baby, Footprints, GraduationCap, Pencil, Trash2, User } from 'lucide-react';
import type { Dispatch } from 'react';
import type { AgeGroup, FamilyMember, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { FamilyFormAction, FamilyFormState } from './familyFormReducer';
import { MemberEditForm } from './MemberEditForm';

function AgeGroupIcon({ ageGroup }: { ageGroup: AgeGroup }) {
  switch (ageGroup) {
    case 'infant_toddler':
      return <Baby className="w-3.5 h-3.5 text-[#4D6B50]" aria-hidden="true" />;
    case 'school_child':
      return <GraduationCap className="w-3.5 h-3.5 text-[#4D6B50]" aria-hidden="true" />;
    case 'older_adult':
      return <Footprints className="w-3.5 h-3.5 text-[#4D6B50]" aria-hidden="true" />;
    default:
      return <User className="w-3.5 h-3.5 text-[#4D6B50]" aria-hidden="true" />;
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
        <MemberEditForm
          lang={lang}
          state={state}
          dispatch={dispatch}
          onSaveEditMember={onSaveEditMember}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#263C32] to-[#3A594B] text-[#DCE9DD] flex items-center justify-center font-display text-sm font-bold shrink-0">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-[#252D28]">{member.name}</h3>
                <p className="text-xs text-[#565F58] flex items-center gap-1">
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
                className="p-1.5 rounded-lg text-[#565F58] hover:text-[#263C32] hover:bg-[#F7F7F1] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void onDeleteMember(member.id)}
                aria-label={`Remove ${member.name}`}
                className="p-1.5 rounded-lg text-[#565F58] hover:text-[#B33A2E] hover:bg-[#F7F7F1] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E7E1] flex items-center justify-between text-xs">
            <span className="font-medium text-[#252D28]">
              {t(lang, `pref_${member.activityPreference}`)}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#F7F7F1] text-[#565F58]">
              {t(lang, `flex_${member.routineFlexibility}`)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
