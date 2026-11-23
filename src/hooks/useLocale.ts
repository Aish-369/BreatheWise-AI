import { useCallback, useState } from 'react';
import type { HouseholdProfile, LanguageCode } from '../shared/types';
import { updateSettingsApi } from '../utils/api';

interface UseLocaleOptions {
  household: HouseholdProfile | null | undefined;
  useFixtures: boolean;
  simulateOutage: boolean;
  runAction: <T>(action: () => Promise<T>) => Promise<T>;
}

export function useLocale({ household, useFixtures, simulateOutage, runAction }: UseLocaleOptions) {
  const [lang, setLang] = useState<LanguageCode>('en');

  const handleLanguageChange = useCallback(
    async (nextLang: LanguageCode) => {
      setLang(nextLang);
      if (household) {
        await runAction(() =>
          updateSettingsApi({
            language: nextLang,
            useDemoFixtures: useFixtures,
            simulateOutage,
            defaultCity: household.city,
          })
        );
      }
    },
    [household, useFixtures, simulateOutage, runAction]
  );

  return { lang, setLang, handleLanguageChange };
}
