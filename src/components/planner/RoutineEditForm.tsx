import { X } from 'lucide-react';
import type { Dispatch } from 'react';
import type { FamilyMember, LanguageCode, TimeWindow } from '../../shared/types';
import { t } from '../../i18n/translations';
import { TIME_WINDOWS, type PlannerFormAction, type PlannerFormState } from './plannerFormReducer';

interface RoutineEditFormProps {
  lang: LanguageCode;
  members: FamilyMember[];
  state: PlannerFormState;
  dispatch: Dispatch<PlannerFormAction>;
  onSaveEdit: (e: React.FormEvent) => void;
}

export function RoutineEditForm({
  lang,
  members,
  state,
  dispatch,
  onSaveEdit,
}: RoutineEditFormProps) {
  return (
    <form onSubmit={onSaveEdit} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#263C32]">{t(lang, 'ui_edit_routine')}</span>
        <button
          type="button"
          aria-label={t(lang, 'action_close')}
          onClick={() => dispatch({ type: 'cancelEdit' })}
          className="p-1 text-[#565F58] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        type="text"
        required
        aria-label="Edit activity title"
        value={state.editTitle}
        onChange={(e) => dispatch({ type: 'setField', field: 'editTitle', value: e.target.value })}
        className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E7E1] rounded-lg"
      />
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label="Edit setting"
          value={state.editEnv}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'editEnv',
              value: e.target.value as 'outdoor' | 'indoor',
            })
          }
          className="px-2 py-1.5 text-xs bg-white border border-[#E2E7E1] rounded-lg"
        >
          <option value="outdoor">{t(lang, 'env_outdoor')}</option>
          <option value="indoor">{t(lang, 'env_indoor')}</option>
        </select>
        <select
          aria-label="Edit flexibility"
          value={state.editFlex}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'editFlex',
              value: e.target.value as 'fixed' | 'flexible',
            })
          }
          className="px-2 py-1.5 text-xs bg-white border border-[#E2E7E1] rounded-lg"
        >
          <option value="flexible">{t(lang, 'flex_flexible')}</option>
          <option value="fixed">{t(lang, 'flex_fixed')}</option>
        </select>
        <select
          aria-label="Edit time window"
          value={state.editWindow}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'editWindow', value: e.target.value as TimeWindow })
          }
          className="px-2 py-1.5 text-xs font-mono bg-white border border-[#E2E7E1] rounded-lg"
        >
          {TIME_WINDOWS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        aria-label="Edit routine notes"
        value={state.editNotes}
        onChange={(e) => dispatch({ type: 'setField', field: 'editNotes', value: e.target.value })}
        placeholder={t(lang, 'ui_notes_optional')}
        className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E7E1] rounded-lg"
      />
      <div className="flex flex-wrap gap-1.5">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => dispatch({ type: 'toggleEditMember', id: m.id })}
            className={`px-2.5 py-1 text-[11px] rounded-md border cursor-pointer ${
              state.editMemberIds.includes(m.id)
                ? 'bg-[#263C32] text-white border-[#263C32]'
                : 'bg-white text-[#565F58] border-[#E2E7E1]'
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={state.submitting || state.editMemberIds.length === 0}
          className="px-4 py-1.5 text-xs font-medium bg-[#263C32] text-white rounded-lg cursor-pointer"
        >
          {t(lang, 'action_save_edit')}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'cancelEdit' })}
          className="px-3 py-1.5 text-xs border border-[#E2E7E1] bg-white rounded-lg cursor-pointer"
        >
          {t(lang, 'action_cancel')}
        </button>
      </div>
    </form>
  );
}
