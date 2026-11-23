// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEntityCrudHandlers } from '../src/hooks/useEntityCrudHandlers';

const api = vi.hoisted(() => ({
  addMemberApi: vi.fn(),
  updateMemberApi: vi.fn(),
  deleteMemberApi: vi.fn(),
  addRoutineApi: vi.fn(),
  updateRoutineApi: vi.fn(),
  toggleRoutineCompletionApi: vi.fn(),
  deleteRoutineApi: vi.fn(),
  createLocationApi: vi.fn(),
  updateLocationApi: vi.fn(),
  deleteLocationApi: vi.fn(),
}));

vi.mock('../src/utils/api', () => api);

describe('useEntityCrudHandlers', () => {
  beforeEach(() => {
    Object.values(api).forEach((mock) => {
      mock.mockReset();
      mock.mockResolvedValue(undefined);
    });
  });

  it('routes every member, routine, and location operation through mutateAndReload', async () => {
    const mutateAndReload = vi.fn(async (operation: () => Promise<unknown>) => operation());
    const { result } = renderHook(() => useEntityCrudHandlers(mutateAndReload));
    const payload = { name: 'Example' };

    await result.current.handleAddMember(payload as never);
    await result.current.handleUpdateMember('member-1', payload as never);
    await result.current.handleDeleteMember('member-1');
    await result.current.handleAddRoutine(payload as never);
    await result.current.handleUpdateRoutine('routine-1', payload as never);
    await result.current.handleToggleRoutineCompletion('routine-1', true);
    await result.current.handleDeleteRoutine('routine-1');
    await result.current.handleCreateLocation(payload as never);
    await result.current.handleUpdateLocation('location-1', payload as never);
    await result.current.handleDeleteLocation('location-1');

    expect(mutateAndReload).toHaveBeenCalledTimes(10);
    expect(api.addMemberApi).toHaveBeenCalledWith(payload);
    expect(api.updateMemberApi).toHaveBeenCalledWith('member-1', payload);
    expect(api.deleteMemberApi).toHaveBeenCalledWith('member-1');
    expect(api.addRoutineApi).toHaveBeenCalledWith(payload);
    expect(api.updateRoutineApi).toHaveBeenCalledWith('routine-1', payload);
    expect(api.toggleRoutineCompletionApi).toHaveBeenCalledWith('routine-1', true);
    expect(api.deleteRoutineApi).toHaveBeenCalledWith('routine-1');
    expect(api.createLocationApi).toHaveBeenCalledWith(payload);
    expect(api.updateLocationApi).toHaveBeenCalledWith('location-1', payload);
    expect(api.deleteLocationApi).toHaveBeenCalledWith('location-1');
  });

  it('preserves the mutation promise rejection for the caller', async () => {
    const failure = new Error('API request failed');
    const mutateAndReload = vi.fn(async (operation: () => Promise<unknown>) => operation());
    api.deleteMemberApi.mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useEntityCrudHandlers(mutateAndReload));

    await expect(result.current.handleDeleteMember('member-2')).rejects.toThrow(
      'API request failed'
    );
  });
});
