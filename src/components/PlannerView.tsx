import { useReducer } from 'react';
import { RefreshCw } from 'lucide-react';
import type {
  ActivityRoutine,
  ActivityRoutineInput,
  FamilyMember,
  ForecastSlot,
  LanguageCode,
  ProtectionPlanResult,
} from '../shared/types';
import { t } from '../i18n/translations';
import { createInitialPlannerState, plannerFormReducer } from './planner/plannerFormReducer';
import { DayPartSummaryStrip } from './planner/DayPartSummaryStrip';
import { RoutineTimelineCard } from './planner/RoutineTimelineCard';
import { AddRoutineForm } from './planner/AddRoutineForm';

interface PlannerViewProps {
  lang: LanguageCode;
  members: FamilyMember[];
  routines: ActivityRoutine[];
  plan: ProtectionPlanResult;
  forecasts: ForecastSlot[];
  onAddRoutine: (input: ActivityRoutineInput) => Promise<void>;
  onUpdateRoutine: (routineId: string, input: ActivityRoutineInput) => Promise<void>;
  onToggleCompletion: (routineId: string, completed: boolean) => Promise<void>;
  onDeleteRoutine: (routineId: string) => Promise<void>;
  onRecalculatePlan: () => void;
}

export function PlannerView({
  lang,
  members,
  routines,
  plan,
  forecasts,
  onAddRoutine,
  onUpdateRoutine,
  onToggleCompletion,
  onDeleteRoutine,
  onRecalculatePlan,
}: PlannerViewProps) {
  const [state, dispatch] = useReducer(plannerFormReducer, members, createInitialPlannerState);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.title.trim() || state.selectedMemberIds.length === 0) return;
    dispatch({ type: 'setField', field: 'submitting', value: true });
    try {
      await onAddRoutine({
        title: state.title.trim(),
        environment: state.environment,
        flexibility: state.flexibility,
        preferredWindow: state.preferredWindow,
        memberIds: state.selectedMemberIds,
        notes: state.notes.trim() || undefined,
      });
      dispatch({ type: 'resetNewRoutine' });
    } finally {
      dispatch({ type: 'setField', field: 'submitting', value: false });
    }
  };

  const handleSaveEditRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.editingRoutineId || !state.editTitle.trim() || state.editMemberIds.length === 0)
      return;
    dispatch({ type: 'setField', field: 'submitting', value: true });
    try {
      await onUpdateRoutine(state.editingRoutineId, {
        title: state.editTitle.trim(),
        environment: state.editEnv,
        flexibility: state.editFlex,
        preferredWindow: state.editWindow,
        memberIds: state.editMemberIds,
        notes: state.editNotes.trim() || undefined,
      });
      dispatch({ type: 'cancelEdit' });
    } finally {
      dispatch({ type: 'setField', field: 'submitting', value: false });
    }
  };

  const filteredPlan = plan.dailyPlan.filter((item) => {
    if (state.filter === 'shifted') {
      return item.status === 'adjust_window' || item.status === 'move_indoors';
    }
    if (state.filter === 'precautions') return item.status === 'proceed_with_precautions';
    if (state.filter === 'indoor') return item.environment === 'indoor';
    return true;
  });

  const filterTabs = [
    { id: 'all', label: t(lang, 'ui_filter_all') },
    { id: 'shifted', label: t(lang, 'ui_filter_shifted') },
    { id: 'precautions', label: t(lang, 'ui_filter_precautions') },
    { id: 'indoor', label: t(lang, 'ui_filter_indoor') },
  ] as const;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">
            {t(lang, 'plan_title')}
          </h1>
          <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'plan_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRecalculatePlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#E2E7E1] text-[#263C32] rounded-lg hover:bg-[#DCE9DD]/45 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t(lang, 'action_recalculate')}</span>
          </button>

          <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg">
            {filterTabs.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => dispatch({ type: 'setField', field: 'filter', value: f.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  state.filter === f.id
                    ? 'bg-[#263C32] text-white'
                    : 'text-[#89918A] hover:text-[#252D28]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DayPartSummaryStrip lang={lang} dailyPlan={plan.dailyPlan} forecasts={forecasts} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <RoutineTimelineCard
          lang={lang}
          members={members}
          routineCount={routines.length}
          filteredPlan={filteredPlan}
          state={state}
          dispatch={dispatch}
          onStartEdit={(id) => {
            const found = routines.find((r) => r.id === id);
            if (found) dispatch({ type: 'startEdit', routine: found });
          }}
          onSaveEdit={(e) => void handleSaveEditRoutine(e)}
          onToggleCompletion={onToggleCompletion}
          onDeleteRoutine={onDeleteRoutine}
        />

        <AddRoutineForm
          lang={lang}
          members={members}
          state={state}
          dispatch={dispatch}
          onSubmit={(e) => void handleSubmit(e)}
        />
      </div>
    </div>
  );
}
