import { useMemo } from 'react';
import type { ActivityRoutineInput, FamilyMemberInput, LocationInput } from '../shared/types';
import {
  addMemberApi,
  addRoutineApi,
  createLocationApi,
  deleteLocationApi,
  deleteMemberApi,
  deleteRoutineApi,
  toggleRoutineCompletionApi,
  updateLocationApi,
  updateMemberApi,
  updateRoutineApi,
} from '../utils/api';

export function useEntityCrudHandlers(
  mutateAndReload: (fn: () => Promise<unknown>) => Promise<void>
) {
  return useMemo(
    () => ({
      handleAddMember: (input: FamilyMemberInput) => mutateAndReload(() => addMemberApi(input)),
      handleUpdateMember: (id: string, input: FamilyMemberInput) =>
        mutateAndReload(() => updateMemberApi(id, input)),
      handleDeleteMember: (id: string) => mutateAndReload(() => deleteMemberApi(id)),
      handleAddRoutine: (input: ActivityRoutineInput) =>
        mutateAndReload(() => addRoutineApi(input)),
      handleUpdateRoutine: (id: string, input: ActivityRoutineInput) =>
        mutateAndReload(() => updateRoutineApi(id, input)),
      handleToggleRoutineCompletion: (id: string, completed: boolean) =>
        mutateAndReload(() => toggleRoutineCompletionApi(id, completed)),
      handleDeleteRoutine: (id: string) => mutateAndReload(() => deleteRoutineApi(id)),
      handleCreateLocation: (input: LocationInput) =>
        mutateAndReload(() => createLocationApi(input)),
      handleUpdateLocation: (id: string, input: LocationInput) =>
        mutateAndReload(() => updateLocationApi(id, input)),
      handleDeleteLocation: (id: string) => mutateAndReload(() => deleteLocationApi(id)),
    }),
    [mutateAndReload]
  );
}
