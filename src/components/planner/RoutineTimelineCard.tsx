import type { Dispatch } from 'react';
import type { DailyPlanItem, FamilyMember, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { PlannerFormAction, PlannerFormState } from './plannerFormReducer';
import { RoutineEditForm } from './RoutineEditForm';
import { RoutineDisplayCard } from './RoutineDisplayCard';

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
        <p className="py-6 text-xs text-[#565F58]">{t(lang, 'ui_no_routines')}</p>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-[#E2E7E1]">
          {filteredPlan.map((item) => {
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
                    <RoutineEditForm
                      lang={lang}
                      members={members}
                      state={state}
                      dispatch={dispatch}
                      onSaveEdit={onSaveEdit}
                    />
                  ) : (
                    <RoutineDisplayCard
                      lang={lang}
                      item={item}
                      onStartEdit={onStartEdit}
                      onToggleCompletion={onToggleCompletion}
                      onDeleteRoutine={onDeleteRoutine}
                    />
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
