import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ActivityRoutineInput,
  DataProviderRecord,
  FamilyMemberInput,
  HouseholdInput,
  LanguageCode,
  LocationInput,
  ScenarioModification,
} from '../shared/types';
import {
  addMemberApi,
  addRoutineApi,
  clearLocalApi,
  createLocationApi,
  deleteLocationApi,
  deleteMemberApi,
  deleteRoutineApi,
  ensureBrowserSession,
  fetchBootstrap,
  fetchProvidersApi,
  importCamsApi,
  runScenarioApi,
  saveHouseholdApi,
  toggleRoutineCompletionApi,
  updateLocationApi,
  updateMemberApi,
  updateRoutineApi,
  updateSettingsApi,
  type BootstrapPayload,
} from '../utils/api';
import { t } from '../i18n/translations';
import { useLocale } from './useLocale';

export function useHouseholdData() {
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [useFixtures, setUseFixtures] = useState(false);
  const initializedFromServer = useRef(false);

  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [providers, setProviders] = useState<DataProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clearedEmpty, setClearedEmpty] = useState(false);

  const langRef = useRef<LanguageCode>('en');

  const runAction = useCallback(async <T>(action: () => Promise<T>): Promise<T> => {
    setActionError(null);
    try {
      return await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t(langRef.current, 'error_generic'));
      throw err;
    }
  }, []);

  const { lang, setLang, handleLanguageChange } = useLocale({
    household: data?.household,
    useFixtures,
    simulateOutage,
    runAction,
  });
  langRef.current = lang;

  const loadBootstrap = useCallback(
    async (opts?: { persist?: boolean; outage?: boolean; fixtures?: boolean; city?: string }) => {
      const hasOverride = typeof opts?.outage === 'boolean' || typeof opts?.fixtures === 'boolean';
      const outage = opts?.outage ?? (initializedFromServer.current ? simulateOutage : undefined);
      const fixtures = opts?.fixtures ?? (initializedFromServer.current ? useFixtures : undefined);
      setLoading(true);
      setErrorMsg(null);
      try {
        await ensureBrowserSession();
        const payload = await fetchBootstrap({
          city: opts?.city,
          simulateOutage: hasOverride || initializedFromServer.current ? outage : undefined,
          useFixtures: hasOverride || initializedFromServer.current ? fixtures : undefined,
          persist: opts?.persist ?? false,
        });
        setData(payload);
        setActionError(null);
        setClearedEmpty(false);
        if (payload.settings) {
          setSimulateOutage(payload.settings.simulateOutage);
          setUseFixtures(payload.settings.useDemoFixtures);
          setLang(payload.settings.language);
          initializedFromServer.current = true;
        } else if (payload.household?.language) {
          setLang(payload.household.language);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : t(lang, 'error_generic'));
      } finally {
        setLoading(false);
      }
    },
    [simulateOutage, useFixtures, lang, setLang]
  );

  useEffect(() => {
    void loadBootstrap();
    void fetchProvidersApi()
      .then((res) => setProviders(res.providers))
      .catch(() => {
        /* non-fatal fallback; SettingsView still loads or uses metadata */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutateAndReload = useCallback(
    async (fn: () => Promise<unknown>) => {
      await runAction(fn);
      await loadBootstrap();
    },
    [runAction, loadBootstrap]
  );

  const handleToggleFixtures = async (nextEnabled: boolean) => {
    setUseFixtures(nextEnabled);
    if (data?.household) {
      await runAction(() =>
        updateSettingsApi({
          language: lang,
          useDemoFixtures: nextEnabled,
          simulateOutage,
          defaultCity: data.household.city,
        })
      );
    }
    await loadBootstrap({ outage: simulateOutage, fixtures: nextEnabled });
  };

  const handleToggleOutage = async (nextOutage: boolean) => {
    setSimulateOutage(nextOutage);
    if (data?.household) {
      await runAction(() =>
        updateSettingsApi({
          language: lang,
          useDemoFixtures: useFixtures,
          simulateOutage: nextOutage,
          defaultCity: data.household.city,
        })
      );
    }
    await loadBootstrap({ outage: nextOutage, fixtures: useFixtures });
  };

  const handleSaveHousehold = async (input: HouseholdInput) => {
    await runAction(() => saveHouseholdApi(input));
    setLang(input.language);
    await loadBootstrap();
  };

  const handleImportCams = async (rawText: string) => {
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
  };

  const handleRunScenario = async (mod: ScenarioModification) => {
    const scenarioResult = await runAction(() =>
      runScenarioApi(mod, { simulateOutage, useFixtures })
    );
    await loadBootstrap();
    return scenarioResult;
  };

  const handleClearLocal = async () => {
    await runAction(() => clearLocalApi());
    setClearedEmpty(true);
    setData(null);
  };

  return {
    data,
    providers,
    loading,
    errorMsg,
    actionError,
    setActionError,
    clearedEmpty,
    simulateOutage,
    useFixtures,
    lang,
    loadBootstrap,
    handleLanguageChange,
    handleToggleFixtures,
    handleToggleOutage,
    handleSaveHousehold,
    handleAddMember: (input: FamilyMemberInput) => mutateAndReload(() => addMemberApi(input)),
    handleUpdateMember: (id: string, input: FamilyMemberInput) =>
      mutateAndReload(() => updateMemberApi(id, input)),
    handleDeleteMember: (id: string) => mutateAndReload(() => deleteMemberApi(id)),
    handleAddRoutine: (input: ActivityRoutineInput) => mutateAndReload(() => addRoutineApi(input)),
    handleUpdateRoutine: (id: string, input: ActivityRoutineInput) =>
      mutateAndReload(() => updateRoutineApi(id, input)),
    handleToggleRoutineCompletion: (id: string, completed: boolean) =>
      mutateAndReload(() => toggleRoutineCompletionApi(id, completed)),
    handleDeleteRoutine: (id: string) => mutateAndReload(() => deleteRoutineApi(id)),
    handleCreateLocation: (input: LocationInput) => mutateAndReload(() => createLocationApi(input)),
    handleUpdateLocation: (id: string, input: LocationInput) =>
      mutateAndReload(() => updateLocationApi(id, input)),
    handleDeleteLocation: (id: string) => mutateAndReload(() => deleteLocationApi(id)),
    handleImportCams,
    handleRunScenario,
    handleClearLocal,
  };
}
