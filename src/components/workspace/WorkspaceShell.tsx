import { useCallback, useMemo } from 'react';
import type { LanguageCode } from '../../shared/types';
import { computeActiveAlerts, getNavItems } from './navConfig';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceMobileDrawer } from './WorkspaceMobileDrawer';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceViewRouter } from './WorkspaceViewRouter';
import { WorkspaceActionError, WorkspaceEmptyOrError } from './WorkspaceStatusBanner';
import type { useHouseholdData } from '../../hooks/useHouseholdData';
import type { useNavigationState } from '../../hooks/useNavigationState';

interface WorkspaceShellProps {
  nav: ReturnType<typeof useNavigationState>;
  hh: ReturnType<typeof useHouseholdData>;
  onChangeLang: (next: LanguageCode) => void;
  onBackToLanding: () => void;
  onRefresh: () => void;
}

function useMenuToggles(nav: ReturnType<typeof useNavigationState>) {
  const { setLocationMenuOpen, setAlertsMenuOpen, setProfileMenuOpen } = nav;
  return {
    onToggleLocationMenu: useCallback(() => {
      setLocationMenuOpen((o) => !o);
      setAlertsMenuOpen(false);
      setProfileMenuOpen(false);
    }, [setLocationMenuOpen, setAlertsMenuOpen, setProfileMenuOpen]),
    onToggleAlertsMenu: useCallback(() => {
      setAlertsMenuOpen((o) => !o);
      setLocationMenuOpen(false);
      setProfileMenuOpen(false);
    }, [setAlertsMenuOpen, setLocationMenuOpen, setProfileMenuOpen]),
    onToggleProfileMenu: useCallback(() => {
      setProfileMenuOpen((o) => !o);
      setLocationMenuOpen(false);
      setAlertsMenuOpen(false);
    }, [setProfileMenuOpen, setLocationMenuOpen, setAlertsMenuOpen]),
  };
}

function WorkspaceRouterBound({
  nav,
  hh,
  onChangeLang,
}: {
  nav: ReturnType<typeof useNavigationState>;
  hh: ReturnType<typeof useHouseholdData>;
  onChangeLang: (next: LanguageCode) => void;
}) {
  if (!hh.data) return null;
  return (
    <WorkspaceViewRouter
      activeTab={nav.activeTab}
      familySubMode={nav.familySubMode}
      airSubTab={nav.airSubTab}
      settingsSubTab={nav.settingsSubTab}
      lang={hh.lang}
      data={hh.data}
      providers={hh.providers}
      simulateOutage={hh.simulateOutage}
      useFixtures={hh.useFixtures}
      onNavigate={nav.navigateSection}
      onRefresh={hh.loadBootstrap}
      onSaveHousehold={hh.handleSaveHousehold}
      onAddMember={hh.handleAddMember}
      onUpdateMember={hh.handleUpdateMember}
      onDeleteMember={hh.handleDeleteMember}
      onImportCams={hh.handleImportCams}
      onAddRoutine={hh.handleAddRoutine}
      onUpdateRoutine={hh.handleUpdateRoutine}
      onToggleRoutineCompletion={hh.handleToggleRoutineCompletion}
      onDeleteRoutine={hh.handleDeleteRoutine}
      onRunScenario={hh.handleRunScenario}
      onCreateLocation={hh.handleCreateLocation}
      onUpdateLocation={hh.handleUpdateLocation}
      onDeleteLocation={hh.handleDeleteLocation}
      onChangeLang={onChangeLang}
      onToggleOutage={(next) => void hh.handleToggleOutage(next)}
      onToggleDemoFixtures={(next) => void hh.handleToggleFixtures(next)}
      onClearLocal={hh.handleClearLocal}
    />
  );
}

export function WorkspaceShell({
  nav,
  hh,
  onChangeLang,
  onBackToLanding,
  onRefresh,
}: WorkspaceShellProps) {
  const { handleSaveHousehold } = hh;
  const { closeHeaderMenus, setMobileMenuOpen } = nav;
  const navItems = useMemo(() => getNavItems(hh.lang), [hh.lang]);
  const activeAlerts = useMemo(() => computeActiveAlerts(hh.data, hh.lang), [hh.data, hh.lang]);
  const menuToggles = useMenuToggles(nav);

  const onQuickSwitchCity = useCallback(
    async (city: string, locality = '') => {
      closeHeaderMenus();
      if (!hh.data?.household) return;
      await handleSaveHousehold({
        name: hh.data.household.name,
        city,
        locality,
        language: hh.lang,
        sensitivityTags: hh.data.household.sensitivityTags,
      });
    },
    [closeHeaderMenus, hh.data?.household, hh.lang, handleSaveHousehold]
  );

  return (
    <div className="min-h-screen bg-[#F7F7F1] text-[#252D28] flex">
      <WorkspaceSidebar
        lang={hh.lang}
        activeTab={nav.activeTab}
        navItems={navItems}
        householdName={hh.data?.household?.name}
        householdCity={hh.data?.household?.city}
        memberCount={hh.data?.members.length ?? 0}
        onNavigate={nav.navigateSection}
        onBackToLanding={onBackToLanding}
        onChangeLang={onChangeLang}
      />
      <WorkspaceMobileDrawer
        open={nav.mobileMenuOpen}
        lang={hh.lang}
        activeTab={nav.activeTab}
        navItems={navItems}
        householdCity={hh.data?.household?.city}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={nav.navigateSection}
        onChangeLang={onChangeLang}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <WorkspaceHeader
          lang={hh.lang}
          data={hh.data}
          loading={hh.loading}
          activeTab={nav.activeTab}
          navItems={navItems}
          activeAlerts={activeAlerts}
          mobileMenuOpen={nav.mobileMenuOpen}
          locationMenuOpen={nav.locationMenuOpen}
          alertsMenuOpen={nav.alertsMenuOpen}
          profileMenuOpen={nav.profileMenuOpen}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleLocationMenu={menuToggles.onToggleLocationMenu}
          onToggleAlertsMenu={menuToggles.onToggleAlertsMenu}
          onToggleProfileMenu={menuToggles.onToggleProfileMenu}
          onQuickSwitchCity={(city, locality) => void onQuickSwitchCity(city, locality)}
          onNavigateSection={nav.navigateSection}
          onChangeLang={onChangeLang}
          onBackToLanding={onBackToLanding}
          onRefresh={onRefresh}
        />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-7">
          {hh.actionError && (
            <WorkspaceActionError
              message={hh.actionError}
              onDismiss={() => hh.setActionError(null)}
            />
          )}
          {hh.clearedEmpty || hh.errorMsg || !hh.data ? (
            <WorkspaceEmptyOrError
              lang={hh.lang}
              clearedEmpty={hh.clearedEmpty}
              errorMsg={hh.errorMsg}
              onRetry={onRefresh}
            />
          ) : (
            <WorkspaceRouterBound nav={nav} hh={hh} onChangeLang={onChangeLang} />
          )}
        </main>
      </div>
    </div>
  );
}
