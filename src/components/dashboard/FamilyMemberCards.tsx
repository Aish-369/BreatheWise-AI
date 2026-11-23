import { ArrowRight } from 'lucide-react';
import type { FamilyMember, LanguageCode, ProtectionPlanResult } from '../../shared/types';
import { t } from '../../i18n/translations';
import { getMemberProtectionStatus, memberAgeIcon } from './dashboardHelpers';

interface FamilyMemberCardsProps {
  lang: LanguageCode;
  members: FamilyMember[];
  plan: ProtectionPlanResult;
  selectedMemberFilter: string;
  onSelectMember: (name: string) => void;
  onManageMembers: () => void;
}

export function FamilyMemberCards({
  lang,
  members,
  plan,
  selectedMemberFilter,
  onSelectMember,
  onManageMembers,
}: FamilyMemberCardsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">
          {t(lang, 'side_family')} ({members.length})
        </h2>
        <button
          type="button"
          onClick={onManageMembers}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#263C32] hover:underline underline-offset-4 cursor-pointer"
        >
          <span>{t(lang, 'tab_members')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {members.map((member) => {
          const Icon = memberAgeIcon(member.ageGroup);
          const status = getMemberProtectionStatus(lang, plan, member);
          const isSelected = selectedMemberFilter === member.name;
          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectMember(isSelected ? 'all' : member.name)}
              className={`text-left rounded-xl p-4 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-br from-[#DCE9DD]/65 to-white border-[#263C32] shadow-sm'
                  : 'bg-white border-[#E2E7E1] hover:border-[#829C83] shadow-[0_1px_3px_rgba(37,45,40,0.03)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#263C32] text-[#DCE9DD] flex items-center justify-center font-display text-sm font-semibold shrink-0">
                    {member.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#252D28] truncate">{member.name}</p>
                    <p className="text-[11px] text-[#565F58] truncate">
                      {t(lang, `pref_${member.activityPreference}`)}
                    </p>
                  </div>
                </div>
                <Icon className="w-4 h-4 text-[#4D6B50] shrink-0" />
              </div>

              <div className="mt-3.5 pt-3 border-t border-[#E2E7E1] flex items-center justify-between gap-2 text-[11px]">
                <span className="text-[#565F58] truncate">
                  {t(lang, `flex_${member.routineFlexibility}`)}
                </span>
                <span className={`px-2 py-0.5 rounded-md font-medium shrink-0 ${status.tone}`}>
                  {status.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
