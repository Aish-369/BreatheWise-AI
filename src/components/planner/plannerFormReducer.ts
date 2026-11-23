import type { ActivityRoutine, FamilyMember, TimeWindow } from '../../shared/types';

export const TIME_WINDOWS: TimeWindow[] = [
  '06:00-09:00',
  '09:00-12:00',
  '12:00-16:00',
  '16:00-19:00',
  '19:00-22:00',
];

export type PlannerFilter = 'all' | 'shifted' | 'precautions' | 'indoor';

export interface PlannerFormState {
  title: string;
  environment: 'outdoor' | 'indoor';
  flexibility: 'fixed' | 'flexible';
  preferredWindow: TimeWindow;
  notes: string;
  selectedMemberIds: string[];
  filter: PlannerFilter;
  submitting: boolean;
  editingRoutineId: string | null;
  editTitle: string;
  editEnv: 'outdoor' | 'indoor';
  editFlex: 'fixed' | 'flexible';
  editWindow: TimeWindow;
  editNotes: string;
  editMemberIds: string[];
}

export type PlannerFormAction =
  | {
      type: 'setField';
      field: keyof PlannerFormState;
      value: PlannerFormState[keyof PlannerFormState];
    }
  | { type: 'toggleMember'; id: string }
  | { type: 'toggleEditMember'; id: string }
  | {
      type: 'applyTemplate';
      title: string;
      environment: 'outdoor' | 'indoor';
      flexibility: 'fixed' | 'flexible';
      window: TimeWindow;
    }
  | { type: 'startEdit'; routine: ActivityRoutine }
  | { type: 'cancelEdit' }
  | { type: 'resetNewRoutine' };

export function createInitialPlannerState(members: FamilyMember[]): PlannerFormState {
  return {
    title: '',
    environment: 'outdoor',
    flexibility: 'flexible',
    preferredWindow: '06:00-09:00',
    notes: '',
    selectedMemberIds: members.slice(0, 1).map((m) => m.id),
    filter: 'all',
    submitting: false,
    editingRoutineId: null,
    editTitle: '',
    editEnv: 'outdoor',
    editFlex: 'flexible',
    editWindow: '06:00-09:00',
    editNotes: '',
    editMemberIds: [],
  };
}

export function plannerFormReducer(
  state: PlannerFormState,
  action: PlannerFormAction
): PlannerFormState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value };
    case 'toggleMember':
      return {
        ...state,
        selectedMemberIds: state.selectedMemberIds.includes(action.id)
          ? state.selectedMemberIds.filter((x) => x !== action.id)
          : [...state.selectedMemberIds, action.id],
      };
    case 'toggleEditMember':
      return {
        ...state,
        editMemberIds: state.editMemberIds.includes(action.id)
          ? state.editMemberIds.filter((x) => x !== action.id)
          : [...state.editMemberIds, action.id],
      };
    case 'applyTemplate':
      return {
        ...state,
        title: action.title,
        environment: action.environment,
        flexibility: action.flexibility,
        preferredWindow: action.window,
      };
    case 'startEdit':
      return {
        ...state,
        editingRoutineId: action.routine.id,
        editTitle: action.routine.title,
        editEnv: action.routine.environment,
        editFlex: action.routine.flexibility,
        editWindow: action.routine.preferredWindow,
        editNotes: action.routine.notes ?? '',
        editMemberIds: action.routine.memberIds,
      };
    case 'cancelEdit':
      return { ...state, editingRoutineId: null };
    case 'resetNewRoutine':
      return { ...state, title: '', notes: '' };
  }
}
