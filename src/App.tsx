import { lazy, Suspense, useCallback } from 'react';
import { MotionConfig } from 'motion/react';
import type { LanguageCode } from './shared/types';
import { t } from './i18n/translations';
import { LandingPage } from './components/LandingPage';
import { useHouseholdData } from './hooks/useHouseholdData';
import { useNavigationState } from './hooks/useNavigationState';

const WorkspaceShell = lazy(() =>
  import('./components/workspace/WorkspaceShell').then((m) => ({ default: m.WorkspaceShell }))
);

export default function App() {
  const nav = useNavigationState();
  const hh = useHouseholdData();
  const { handleLanguageChange, loadBootstrap } = hh;
  const { closeHeaderMenus, setViewMode } = nav;

  const onChangeLang = useCallback(
    (next: LanguageCode): void => void handleLanguageChange(next),
    [handleLanguageChange]
  );

  const onBackToLanding = useCallback((): void => {
    closeHeaderMenus();
    setViewMode('landing');
  }, [closeHeaderMenus, setViewMode]);

  const onRefresh = useCallback((): void => void loadBootstrap(), [loadBootstrap]);

  return (
    <MotionConfig reducedMotion="user">
      {nav.viewMode === 'landing' ? (
        <LandingPage
          lang={hh.lang}
          onChangeLang={onChangeLang}
          onEnterWorkspace={nav.navigateSection}
        />
      ) : (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#F7F7F1] flex items-center justify-center text-xs text-[#565F58]">
              {t(hh.lang, 'loading')}
            </div>
          }
        >
          <WorkspaceShell
            nav={nav}
            hh={hh}
            onChangeLang={onChangeLang}
            onBackToLanding={onBackToLanding}
            onRefresh={onRefresh}
          />
        </Suspense>
      )}
    </MotionConfig>
  );
}
