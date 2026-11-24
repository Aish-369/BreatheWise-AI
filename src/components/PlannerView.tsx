import { useReducer } from 'react';
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
import { PlannerHeaderBar } from './planner/PlannerHeaderBar';
import { DayPartSummaryStrip } from './planner/DayPartSummaryStrip';
import { RoutineTimelineCard } from './planner/RoutineTimelineCard';
import { AddRoutineForm } from './planner/AddRoutineForm';
import { AiPlanExplanationCard } from './planner/AiPlanExplanationCard';

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
    if (!state.editingRoutineId || !state.editTitle.trim() || state.editMemberIds.length === 0) {
      return;
    }
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

  return (
    <div className="space-y-7" aria-label={t(lang, 'plan_title')}>
      <PlannerHeaderBar
        lang={lang}
        filter={state.filter}
        onSelectFilter={(filter) => dispatch({ type: 'setField', field: 'filter', value: filter })}
        onRecalculatePlan={onRecalculatePlan}
      />

      <DayPartSummaryStrip lang={lang} dailyPlan={plan.dailyPlan} forecasts={forecasts} />

      <AiPlanExplanationCard lang={lang} plan={plan} members={members} />

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
