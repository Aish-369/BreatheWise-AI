import { useCallback, useMemo } from 'react';
import type { HouseholdInput, LanguageCode, ScenarioModification } from '../shared/types';
import {
  clearLocalApi,
  importCamsApi,
  runScenarioApi,
  saveHouseholdApi,
  updateSettingsApi,
  type BootstrapPayload,
} from '../utils/api';
import { useEntityCrudHandlers } from './useEntityCrudHandlers';

interface UseHouseholdMutationsOptions {
  data: BootstrapPayload | null;
  lang: LanguageCode;
  simulateOutage: boolean;
  useFixtures: boolean;
  setLang: (lang: LanguageCode) => void;
  setUseFixtures: (next: boolean) => void;
  setSimulateOutage: (next: boolean) => void;
  setClearedEmpty: (cleared: boolean) => void;
  setData: (data: BootstrapPayload | null) => void;
  runAction: <T>(action: () => Promise<T>) => Promise<T>;
  loadBootstrap: (opts?: {
    persist?: boolean;
    outage?: boolean;
    fixtures?: boolean;
    city?: string;
  }) => Promise<void>;
}

export function useHouseholdMutations({
  data,
  lang,
  simulateOutage,
  useFixtures,
  setLang,
  setUseFixtures,
  setSimulateOutage,
  setClearedEmpty,
  setData,
  runAction,
  loadBootstrap,
}: UseHouseholdMutationsOptions) {
  const mutateAndReload = useCallback(
    async (fn: () => Promise<unknown>) => {
      await runAction(fn);
      await loadBootstrap();
    },
    [runAction, loadBootstrap]
  );

  const crud = useEntityCrudHandlers(mutateAndReload);

  const syncSettingsToggle = useCallback(
    async (nextOutage: boolean, nextFixtures: boolean) => {
      if (data?.household) {
        await runAction(() =>
          updateSettingsApi({
            language: lang,
            useDemoFixtures: nextFixtures,
            simulateOutage: nextOutage,
            defaultCity: data.household.city,
          })
        );
      }
      await loadBootstrap({ outage: nextOutage, fixtures: nextFixtures });
    },
    [data?.household, lang, runAction, loadBootstrap]
  );

  const handleToggleFixtures = useCallback(
    async (nextEnabled: boolean) => {
      setUseFixtures(nextEnabled);
      await syncSettingsToggle(simulateOutage, nextEnabled);
    },
    [setUseFixtures, simulateOutage, syncSettingsToggle]
  );

  const handleToggleOutage = useCallback(
    async (nextOutage: boolean) => {
      setSimulateOutage(nextOutage);
      await syncSettingsToggle(nextOutage, useFixtures);
    },
    [setSimulateOutage, useFixtures, syncSettingsToggle]
  );

  const handleSaveHousehold = useCallback(
    async (input: HouseholdInput) => {
      await runAction(() => saveHouseholdApi(input));
      setLang(input.language);
      await loadBootstrap();
    },
    [runAction, setLang, loadBootstrap]
  );

  const handleImportCams = useCallback(
    async (rawText: string) => {
      try {
        const body = await runAction(() => importCamsApi(rawText));
        await loadBootstrap();
        return {
          ok: true,
          message: `Imported ${body.importedCount} forecast slot(s) for ${body.city}.`,
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Failed to import CAMS forecast.',
        };
      }
    },
    [runAction, loadBootstrap]
  );

  const handleRunScenario = useCallback(
    async (mod: ScenarioModification) => {
      const result = await runAction(() => runScenarioApi(mod, { simulateOutage, useFixtures }));
      await loadBootstrap();
      return result;
    },
    [runAction, simulateOutage, useFixtures, loadBootstrap]
  );

  const handleClearLocal = useCallback(async () => {
    await runAction(() => clearLocalApi());
    setClearedEmpty(true);
    setData(null);
  }, [runAction, setClearedEmpty, setData]);

  return useMemo(
    () => ({
      ...crud,
      handleToggleFixtures,
      handleToggleOutage,
      handleSaveHousehold,
      handleImportCams,
      handleRunScenario,
      handleClearLocal,
    }),
    [
      crud,
      handleToggleFixtures,
      handleToggleOutage,
      handleSaveHousehold,
      handleImportCams,
      handleRunScenario,
      handleClearLocal,
    ]
  );
}
