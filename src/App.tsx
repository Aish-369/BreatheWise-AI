import { MotionConfig } from 'motion/react';
import { X } from 'lucide-react';
import { t } from './i18n/translations';
import { LandingPage } from './components/LandingPage';
import { useHouseholdData } from './hooks/useHouseholdData';
import { useNavigationState } from './hooks/useNavigationState';
import { computeActiveAlerts, getNavItems } from './components/workspace/navConfig';
import { WorkspaceSidebar } from './components/workspace/WorkspaceSidebar';
import { WorkspaceMobileDrawer } from './components/workspace/WorkspaceMobileDrawer';
import { WorkspaceHeader } from './components/workspace/WorkspaceHeader';
import { WorkspaceViewRouter } from './components/workspace/WorkspaceViewRouter';

export default function App() {
  const nav = useNavigationState();
  const hh = useHouseholdData();

  if (nav.viewMode === 'landing') {
    return (
      <MotionConfig reducedMotion="user">
        <LandingPage
          lang={hh.lang}
          onChangeLang={(next) => void hh.handleLanguageChange(next)}
          onEnterWorkspace={nav.navigateSection}
        />
      </MotionConfig>
    );
  }

  const navItems = getNavItems(hh.lang);
  const activeAlerts = computeActiveAlerts(hh.data, hh.lang);

  const handleQuickSwitchCity = async (city: string, locality = '') => {
    nav.closeHeaderMenus();
    if (!hh.data?.household) return;
    await hh.handleSaveHousehold({
      name: hh.data.household.name,
      city,
      locality,
      language: hh.lang,
      sensitivityTags: hh.data.household.sensitivityTags,
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#F7F7F1] text-[#252D28] flex">
        <WorkspaceSidebar
          lang={hh.lang}
          activeTab={nav.activeTab}
          navItems={navItems}
          householdName={hh.data?.household?.name}
          householdCity={hh.data?.household?.city}
          memberCount={hh.data?.members.length ?? 0}
          onNavigate={nav.navigateSection}
          onBackToLanding={() => nav.setViewMode('landing')}
          onChangeLang={(code) => void hh.handleLanguageChange(code)}
        />

        <WorkspaceMobileDrawer
          open={nav.mobileMenuOpen}
          lang={hh.lang}
          activeTab={nav.activeTab}
          navItems={navItems}
          householdCity={hh.data?.household?.city}
          onClose={() => nav.setMobileMenuOpen(false)}
          onNavigate={nav.navigateSection}
          onChangeLang={(code) => void hh.handleLanguageChange(code)}
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
            onOpenMobileMenu={() => nav.setMobileMenuOpen(true)}
            onToggleLocationMenu={() => {
              nav.setLocationMenuOpen((o) => !o);
              nav.setAlertsMenuOpen(false);
              nav.setProfileMenuOpen(false);
            }}
            onToggleAlertsMenu={() => {
              nav.setAlertsMenuOpen((o) => !o);
              nav.setLocationMenuOpen(false);
              nav.setProfileMenuOpen(false);
            }}
            onToggleProfileMenu={() => {
              nav.setProfileMenuOpen((o) => !o);
              nav.setLocationMenuOpen(false);
              nav.setAlertsMenuOpen(false);
            }}
            onQuickSwitchCity={(city, locality) => void handleQuickSwitchCity(city, locality)}
            onNavigateSection={nav.navigateSection}
            onChangeLang={(code) => void hh.handleLanguageChange(code)}
            onBackToLanding={() => {
              nav.closeHeaderMenus();
              nav.setViewMode('landing');
            }}
            onRefresh={() => void hh.loadBootstrap()}
          />

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-7">
            {hh.actionError && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#B33A2E]/35 bg-white px-4 py-3 text-sm text-[#9A2E24] shadow-sm"
              >
                <div>
                  <p className="font-semibold">Action could not be completed</p>
                  <p className="mt-1 text-xs leading-relaxed">{hh.actionError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => hh.setActionError(null)}
                  aria-label="Dismiss error"
                  className="shrink-0 rounded-md p-1 hover:bg-[#F6DFDC] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {hh.clearedEmpty ? (
              <div className="bg-white border border-[#E2E7E1] rounded-2xl p-10 text-center space-y-4">
                <h2 className="font-display text-lg font-semibold text-[#252D28]">
                  {t(hh.lang, 'action_clearLocal')}
                </h2>
                <p className="text-xs text-[#89918A] max-w-md mx-auto">
                  {t(hh.lang, 'ui_confirm_clear_desc')}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
                >
                  {t(hh.lang, 'action_startOnboarding')}
                </button>
              </div>
            ) : hh.errorMsg ? (
              <div className="bg-white border border-[#B33A2E]/40 rounded-2xl p-6 space-y-3">
                <p className="text-sm font-medium text-[#B33A2E]">{hh.errorMsg}</p>
                <button
                  type="button"
                  onClick={() => void hh.loadBootstrap()}
                  className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg cursor-pointer"
                >
                  {t(hh.lang, 'action_refresh')}
                </button>
              </div>
            ) : !hh.data ? (
              <div className="bg-white border border-[#E2E7E1] rounded-2xl p-8 text-xs text-[#89918A]">
                {t(hh.lang, 'loading')}
              </div>
            ) : (
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
                onChangeLang={(next) => void hh.handleLanguageChange(next)}
                onToggleOutage={(next) => void hh.handleToggleOutage(next)}
                onToggleDemoFixtures={(next) => void hh.handleToggleFixtures(next)}
                onClearLocal={hh.handleClearLocal}
              />
            )}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
