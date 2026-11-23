// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HouseholdInput, ScenarioModification } from '../src/shared/types';
import type { BootstrapPayload } from '../src/utils/api';
import { useHouseholdMutations } from '../src/hooks/useHouseholdMutations';

const mocks = vi.hoisted(() => ({
  clearLocalApi: vi.fn(),
  importCamsApi: vi.fn(),
  runScenarioApi: vi.fn(),
  saveHouseholdApi: vi.fn(),
  updateSettingsApi: vi.fn(),
  crud: {
    handleAddMember: vi.fn(),
    handleUpdateMember: vi.fn(),
    handleDeleteMember: vi.fn(),
    handleAddRoutine: vi.fn(),
    handleUpdateRoutine: vi.fn(),
    handleToggleRoutineCompletion: vi.fn(),
    handleDeleteRoutine: vi.fn(),
    handleCreateLocation: vi.fn(),
    handleUpdateLocation: vi.fn(),
    handleDeleteLocation: vi.fn(),
  },
}));

vi.mock('../src/utils/api', () => ({
  clearLocalApi: mocks.clearLocalApi,
  importCamsApi: mocks.importCamsApi,
  runScenarioApi: mocks.runScenarioApi,
  saveHouseholdApi: mocks.saveHouseholdApi,
  updateSettingsApi: mocks.updateSettingsApi,
}));

vi.mock('../src/hooks/useEntityCrudHandlers', () => ({
  useEntityCrudHandlers: () => mocks.crud,
}));

const householdData = {
  household: {
    id: 'household-1',
    name: 'Test household',
    city: 'Pune',
    language: 'en',
    sensitivityTags: [],
  },
} as unknown as BootstrapPayload;

function setup() {
  const setters = {
    setLang: vi.fn(),
    setUseFixtures: vi.fn(),
    setSimulateOutage: vi.fn(),
    setClearedEmpty: vi.fn(),
    setData: vi.fn(),
  };
  const loadBootstrap = vi.fn().mockResolvedValue(undefined);
  const runAction = async <T,>(action: () => Promise<T>): Promise<T> => action();

  const hook = renderHook(() =>
    useHouseholdMutations({
      data: householdData,
      lang: 'en',
      simulateOutage: false,
      useFixtures: false,
      ...setters,
      runAction,
      loadBootstrap,
    })
  );

  return { ...hook, setters, loadBootstrap };
}

describe('useHouseholdMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearLocalApi.mockResolvedValue({ ok: true, cleared: true });
    mocks.importCamsApi.mockResolvedValue({ importedCount: 2, city: 'Pune', slots: [] });
    mocks.runScenarioApi.mockResolvedValue({ id: 'scenario-1' });
    mocks.saveHouseholdApi.mockResolvedValue({ household: householdData.household });
    mocks.updateSettingsApi.mockResolvedValue({ settings: {}, household: householdData.household });
  });

  it('persists fixture toggles and reloads with the selected settings', async () => {
    const { result, setters, loadBootstrap } = setup();

    await act(async () => {
      await result.current.handleToggleFixtures(true);
    });

    expect(setters.setUseFixtures).toHaveBeenCalledWith(true);
    expect(mocks.updateSettingsApi).toHaveBeenCalledWith({
      language: 'en',
      useDemoFixtures: true,
      simulateOutage: false,
      defaultCity: 'Pune',
    });
    expect(loadBootstrap).toHaveBeenCalledWith({ outage: false, fixtures: true });
  });

  it('persists outage toggles and keeps the current fixture preference', async () => {
    const { result, setters, loadBootstrap } = setup();

    await act(async () => {
      await result.current.handleToggleOutage(true);
    });

    expect(setters.setSimulateOutage).toHaveBeenCalledWith(true);
    expect(mocks.updateSettingsApi).toHaveBeenCalledWith({
      language: 'en',
      useDemoFixtures: false,
      simulateOutage: true,
      defaultCity: 'Pune',
    });
    expect(loadBootstrap).toHaveBeenCalledWith({ outage: true, fixtures: false });
  });

  it('saves household details, updates language, and reloads bootstrap data', async () => {
    const { result, setters, loadBootstrap } = setup();
    const input = {
      name: 'Updated household',
      city: 'Ahilyanagar',
      locality: 'Savedi',
      language: 'mr',
      sensitivityTags: [],
    } as HouseholdInput;

    await act(async () => {
      await result.current.handleSaveHousehold(input);
    });

    expect(mocks.saveHouseholdApi).toHaveBeenCalledWith(input);
    expect(setters.setLang).toHaveBeenCalledWith('mr');
    expect(loadBootstrap).toHaveBeenCalledTimes(1);
  });

  it('returns a success result after importing a CAMS forecast', async () => {
    const { result, loadBootstrap } = setup();
    let response: { ok: boolean; message: string } | undefined;

    await act(async () => {
      response = await result.current.handleImportCams('csv forecast content');
    });

    expect(mocks.importCamsApi).toHaveBeenCalledWith('csv forecast content');
    expect(loadBootstrap).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      ok: true,
      message: 'Imported 2 forecast slot(s) for Pune.',
    });
  });

  it('converts CAMS import failures into a user-facing result', async () => {
    mocks.importCamsApi.mockRejectedValueOnce(new Error('Invalid CAMS data'));
    const { result, loadBootstrap } = setup();
    let response: { ok: boolean; message: string } | undefined;

    await act(async () => {
      response = await result.current.handleImportCams('invalid content');
    });

    expect(response).toEqual({ ok: false, message: 'Invalid CAMS data' });
    expect(loadBootstrap).not.toHaveBeenCalled();
  });

  it('runs a scenario, reloads data, and returns the scenario result', async () => {
    const { result, loadBootstrap } = setup();
    const modification = { label: 'Test scenario', pm25Override: 80 } as ScenarioModification;
    let response: unknown;

    await act(async () => {
      response = await result.current.handleRunScenario(modification);
    });

    expect(mocks.runScenarioApi).toHaveBeenCalledWith(modification, {
      simulateOutage: false,
      useFixtures: false,
    });
    expect(loadBootstrap).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ id: 'scenario-1' });
  });

  it('clears local data and switches the workspace into its empty state', async () => {
    const { result, setters } = setup();

    await act(async () => {
      await result.current.handleClearLocal();
    });

    expect(mocks.clearLocalApi).toHaveBeenCalledTimes(1);
    expect(setters.setClearedEmpty).toHaveBeenCalledWith(true);
    expect(setters.setData).toHaveBeenCalledWith(null);
  });
});
