import { Plus } from 'lucide-react';
import type { Dispatch } from 'react';
import type { FamilyMember, LanguageCode, TimeWindow } from '../../shared/types';
import { t } from '../../i18n/translations';
import { TIME_WINDOWS, type PlannerFormAction, type PlannerFormState } from './plannerFormReducer';

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
        <Plus className="w-4 h-4 text-[#829C83]" strokeWidth={1.8} />
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

      <div>
        <label htmlFor="routine-title-input" className="block text-xs text-[#89918A] mb-1">
          Activity Title
        </label>
        <input
          id="routine-title-input"
          type="text"
          required
          value={state.title}
          onChange={(e) => dispatch({ type: 'setField', field: 'title', value: e.target.value })}
          placeholder="e.g. Evening badminton practice"
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="routine-env-select" className="block text-xs text-[#89918A] mb-1">
            Setting
          </label>
          <select
            id="routine-env-select"
            value={state.environment}
            onChange={(e) =>
              dispatch({
                type: 'setField',
                field: 'environment',
                value: e.target.value as 'outdoor' | 'indoor',
              })
            }
            className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          >
            <option value="outdoor">{t(lang, 'env_outdoor')}</option>
            <option value="indoor">{t(lang, 'env_indoor')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="routine-flex-select" className="block text-xs text-[#89918A] mb-1">
            Flexibility
          </label>
          <select
            id="routine-flex-select"
            value={state.flexibility}
            onChange={(e) =>
              dispatch({
                type: 'setField',
                field: 'flexibility',
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

      <div>
        <label htmlFor="routine-window-select" className="block text-xs text-[#89918A] mb-1">
          Preferred Time Window
        </label>
        <select
          id="routine-window-select"
          value={state.preferredWindow}
          onChange={(e) =>
            dispatch({
              type: 'setField',
              field: 'preferredWindow',
              value: e.target.value as TimeWindow,
            })
          }
          className="w-full px-3 py-2 text-sm font-mono bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        >
          {TIME_WINDOWS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="routine-notes-input" className="block text-xs text-[#89918A] mb-1">
          {t(lang, 'ui_notes_optional')}
        </label>
        <input
          id="routine-notes-input"
          type="text"
          value={state.notes}
          onChange={(e) => dispatch({ type: 'setField', field: 'notes', value: e.target.value })}
          placeholder="e.g. Carry water bottle, low-traffic lane"
          className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
        />
      </div>

      <div>
        <span className="block text-xs text-[#89918A] mb-1.5">{t(lang, 'side_family')}</span>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => {
            const active = state.selectedMemberIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => dispatch({ type: 'toggleMember', id: m.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#263C32] text-white border-[#263C32]'
                    : 'bg-[#F7F7F1] text-[#89918A] border-[#E2E7E1] hover:text-[#252D28]'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

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
