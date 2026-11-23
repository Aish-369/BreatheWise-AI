import { Bike, CheckCircle2, Circle, Clock, Home, Pencil, Sun, Trash2, X } from 'lucide-react';
import type { Dispatch } from 'react';
import type { DailyPlanItem, FamilyMember, LanguageCode, TimeWindow } from '../../shared/types';
import { t } from '../../i18n/translations';
import { TIME_WINDOWS, type PlannerFormAction, type PlannerFormState } from './plannerFormReducer';

function statusStyle(status: string): string {
  switch (status) {
    case 'proceed_as_planned':
      return 'bg-[#DCE9DD]/75 text-[#263C32]';
    case 'adjust_window':
      return 'bg-[#263C32] text-white';
    case 'proceed_with_precautions':
      return 'bg-[#F5EBD8] text-[#8E5312]';
    default:
      return 'bg-[#F6DFDC] text-[#9A2E24]';
  }
}

interface RoutineTimelineCardProps {
  lang: LanguageCode;
  members: FamilyMember[];
  routineCount: number;
  filteredPlan: DailyPlanItem[];
  state: PlannerFormState;
  dispatch: Dispatch<PlannerFormAction>;
  onStartEdit: (routineId: string) => void;
  onSaveEdit: (e: React.FormEvent) => void;
  onToggleCompletion: (routineId: string, completed: boolean) => Promise<void>;
  onDeleteRoutine: (routineId: string) => Promise<void>;
}

export function RoutineTimelineCard({
  lang,
  members,
  routineCount,
  filteredPlan,
  state,
  dispatch,
  onStartEdit,
  onSaveEdit,
  onToggleCompletion,
  onDeleteRoutine,
}: RoutineTimelineCardProps) {
  return (
    <div className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E2E7E1]">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">
          {t(lang, 'dash_planner_heading')}
        </h2>
        <span className="font-mono text-xs text-[#525C56] tabular-nums">{routineCount}</span>
      </div>

      {filteredPlan.length === 0 ? (
        <p className="py-6 text-xs text-[#89918A]">{t(lang, 'ui_no_routines')}</p>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-[#E2E7E1]">
          {filteredPlan.map((item) => {
            const EnvIcon =
              item.environment === 'indoor' ? Home : item.suggestedWindow ? Sun : Bike;
            const isEditing = state.editingRoutineId === item.routineId;
            return (
              <div key={item.routineId} className="relative">
                <span className="absolute -left-6 top-2 w-4 h-4 rounded-full bg-white border-2 border-[#263C32]" />
                <div
                  className={`rounded-xl border border-[#E2E7E1] p-4 transition-colors ${
                    item.completedToday ? 'bg-[#DCE9DD]/25' : 'bg-[#F7F7F1]/55 hover:bg-white'
                  }`}
                >
                  {isEditing ? (
                    <form onSubmit={onSaveEdit} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#263C32]">
                          {t(lang, 'ui_edit_routine')}
                        </span>
                        <button
                          type="button"
                          aria-label={t(lang, 'action_close')}
                          onClick={() => dispatch({ type: 'cancelEdit' })}
                          className="p-1 text-[#89918A] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        aria-label="Edit activity title"
                        value={state.editTitle}
                        onChange={(e) =>
                          dispatch({ type: 'setField', field: 'editTitle', value: e.target.value })
                        }
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
                            dispatch({
                              type: 'setField',
                              field: 'editWindow',
                              value: e.target.value as TimeWindow,
                            })
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
                        onChange={(e) =>
                          dispatch({ type: 'setField', field: 'editNotes', value: e.target.value })
                        }
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
                                : 'bg-white text-[#89918A] border-[#E2E7E1]'
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
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <EnvIcon className="w-4 h-4 text-[#263C32] shrink-0" />
                            <h3
                              className={`text-sm font-semibold ${
                                item.completedToday
                                  ? 'line-through text-[#89918A]'
                                  : 'text-[#252D28]'
                              }`}
                            >
                              {item.routineTitle}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#89918A]">
                            <span className="inline-flex items-center gap-1 font-mono text-[#252D28] tabular-nums">
                              <Clock className="w-3 h-3 text-[#829C83]" />
                              {item.suggestedWindow
                                ? `${item.originalWindow} → ${item.suggestedWindow}`
                                : item.originalWindow}
                            </span>
                            <span>·</span>
                            <span>
                              {t(lang, `env_${item.environment}`)} ·{' '}
                              {t(lang, `flex_${item.flexibility}`)} ·{' '}
                              {item.applicableMembers.join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${statusStyle(
                              item.status
                            )}`}
                          >
                            {t(lang, `status_${item.status}`)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void onToggleCompletion(item.routineId, !item.completedToday)
                            }
                            title={
                              item.completedToday
                                ? t(lang, 'ui_completed_today')
                                : t(lang, 'ui_mark_completed')
                            }
                            aria-label={
                              item.completedToday
                                ? t(lang, 'ui_completed_today')
                                : t(lang, 'ui_mark_completed')
                            }
                            className="p-1.5 rounded-lg text-[#263C32] hover:bg-[#DCE9DD]/50 cursor-pointer"
                          >
                            {item.completedToday ? (
                              <CheckCircle2 className="w-4 h-4 text-[#3B6E52]" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#89918A]" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onStartEdit(item.routineId)}
                            aria-label={`${t(lang, 'action_edit')} ${item.routineTitle}`}
                            className="p-1.5 rounded-lg text-[#89918A] hover:text-[#263C32] hover:bg-[#F7F7F1] cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteRoutine(item.routineId)}
                            aria-label={`Remove ${item.routineTitle}`}
                            className="p-1.5 rounded-lg text-[#89918A] hover:text-[#B33A2E] hover:bg-[#F7F7F1] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-[#252D28]">
                        {t(lang, item.rationaleKey, item.rationaleParams)}
                      </p>
                      {item.notes && (
                        <p className="mt-1 text-[11px] italic text-[#89918A]">{item.notes}</p>
                      )}
                      {item.limitationKey && (
                        <p className="mt-1 text-[11px] text-[#8E5312]">
                          {t(lang, `lim_${item.limitationKey}`)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
