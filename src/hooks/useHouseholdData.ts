import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataProviderRecord, LanguageCode } from '../shared/types';
import {
  ensureBrowserSession,
  fetchBootstrap,
  fetchProvidersApi,
  type BootstrapPayload,
} from '../utils/api';
import { t } from '../i18n/translations';
import { useLocale } from './useLocale';
import { useHouseholdMutations } from './useHouseholdMutations';

function resolveBootstrapQueryOpts(
  opts: { persist?: boolean; outage?: boolean; fixtures?: boolean; city?: string } | undefined,
  initialized: boolean,
  simulateOutage: boolean,
  useFixtures: boolean
) {
  const hasOverride = typeof opts?.outage === 'boolean' || typeof opts?.fixtures === 'boolean';
  const includeFlags = hasOverride || initialized;
  return {
    city: opts?.city,
    simulateOutage: includeFlags ? (opts?.outage ?? simulateOutage) : undefined,
    useFixtures: includeFlags ? (opts?.fixtures ?? useFixtures) : undefined,
    persist: opts?.persist ?? false,
  };
}

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
      setLoading(true);
      setErrorMsg(null);
      try {
        await ensureBrowserSession();
        const query = resolveBootstrapQueryOpts(
          opts,
          initializedFromServer.current,
          simulateOutage,
          useFixtures
        );
        const payload = await fetchBootstrap(query);
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
        /* non-fatal fallback */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutations = useHouseholdMutations({
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
  });

  return useMemo(
    () => ({
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
      ...mutations,
    }),
    [
      data,
      providers,
      loading,
      errorMsg,
      actionError,
      clearedEmpty,
      simulateOutage,
      useFixtures,
      lang,
      loadBootstrap,
      handleLanguageChange,
      mutations,
    ]
  );
}
