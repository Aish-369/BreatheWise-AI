import { Plus } from 'lucide-react';
import type { Dispatch } from 'react';
import type { FamilyMember, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { PlannerFormAction, PlannerFormState } from './plannerFormReducer';
import { RoutineFormFields } from './RoutineFormFields';

interface AddRoutineFormProps {
  lang: LanguageCode;
  members: FamilyMember[];
  state: PlannerFormState;
  dispatch: Dispatch<PlannerFormAction>;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddRoutineForm({ lang, members, state, dispatch, onSubmit }: AddRoutineFormProps) {
  const templates = [
    {
      label: t(lang, 'pref_morning_walk'),
      env: 'outdoor' as const,
      flex: 'flexible' as const,
      win: '06:00-09:00' as const,
    },
    {
      label: t(lang, 'pref_commute'),
      env: 'outdoor' as const,
      flex: 'fixed' as const,
      win: '06:00-09:00' as const,
    },
    {
      label: t(lang, 'pref_outdoor_play'),
      env: 'outdoor' as const,
      flex: 'flexible' as const,
      win: '16:00-19:00' as const,
    },
    {
      label: t(lang, 'pref_mostly_indoors'),
      env: 'indoor' as const,
      flex: 'flexible' as const,
      win: '09:00-12:00' as const,
    },
  ];

  return (
    <form
      onSubmit={onSubmit}
      className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
    >
      <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
        <Plus className="w-4 h-4 text-[#4D6B50]" strokeWidth={1.8} />
        <span>{t(lang, 'action_add')}</span>
      </h2>

      <div className="flex flex-wrap gap-1.5">
        {templates.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            onClick={() =>
              dispatch({
                type: 'applyTemplate',
                title: tpl.label,
                environment: tpl.env,
                flexibility: tpl.flex,
                window: tpl.win,
              })
            }
            className="px-2.5 py-1 text-[11px] font-medium bg-[#F7F7F1] border border-[#E2E7E1] rounded-md text-[#252D28] hover:bg-[#DCE9DD]/50 cursor-pointer"
          >
            + {tpl.label}
          </button>
        ))}
      </div>

      <RoutineFormFields lang={lang} members={members} state={state} dispatch={dispatch} />

      <button
        type="submit"
        disabled={state.submitting || state.selectedMemberIds.length === 0}
        className="w-full px-4 py-2.5 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] disabled:opacity-50 cursor-pointer"
      >
        {t(lang, 'action_add')}
      </button>
    </form>
  );
}
