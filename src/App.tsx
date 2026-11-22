import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CalendarClock,
  ChevronDown,
  FileText,
  Info,
  LayoutDashboard,
  MapPin,
  Menu,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  User,
  Users,
  X,
} from 'lucide-react';
import type {
  ActivityRoutineInput,
  DataProviderRecord,
  FamilyMemberInput,
  HouseholdInput,
  LanguageCode,
  LocationInput,
  ScenarioModification,
} from './shared/types';
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
} from './utils/api';
import { t } from './i18n/translations';
import { LandingPage } from './components/LandingPage';

const DashboardView = lazy(() =>
  import('./components/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const FamilyOnboardingView = lazy(() =>
  import('./components/FamilyOnboardingView').then((m) => ({ default: m.FamilyOnboardingView }))
);
const EnvironmentView = lazy(() =>
  import('./components/EnvironmentView').then((m) => ({ default: m.EnvironmentView }))
);
const PlannerView = lazy(() =>
  import('./components/PlannerView').then((m) => ({ default: m.PlannerView }))
);
const SimulatorView = lazy(() =>
  import('./components/SimulatorView').then((m) => ({ default: m.SimulatorView }))
);
const ComparisonView = lazy(() =>
  import('./components/ComparisonView').then((m) => ({ default: m.ComparisonView }))
);
const HistoryView = lazy(() =>
  import('./components/HistoryView').then((m) => ({ default: m.HistoryView }))
);
const SettingsView = lazy(() =>
  import('./components/SettingsView').then((m) => ({ default: m.SettingsView }))
);

type ActiveSection =
  | 'overview'
  | 'family'
  | 'air-quality'
  | 'planner'
  | 'simulator'
  | 'locations'
  | 'reports'
  | 'settings';

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'workspace'>('landing');
  const [activeTab, setActiveTab] = useState<ActiveSection>('overview');
  const [familySubMode, setFamilySubMode] = useState<'members' | 'guided'>('members');
  const [airSubTab, setAirSubTab] = useState<'telemetry' | 'indoor' | 'forecast'>('telemetry');
  const [settingsSubTab, setSettingsSubTab] = useState<'preferences' | 'methodology'>('preferences');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [alertsMenuOpen, setAlertsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [simulateOutage, setSimulateOutage] = useState(false);
  const [useFixtures, setUseFixtures] = useState(false);
  const initializedFromServer = useRef(false);

  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [providers, setProviders] = useState<DataProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [clearedEmpty, setClearedEmpty] = useState(false);

  const runAction = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setActionError(null);
    try { return await action(); }
    catch (err) {
      setActionError(err instanceof Error ? err.message : t(lang, 'error_generic'));
      throw err;
    }
  }, [lang]);

  const closeHeaderMenus = useCallback(() => {
    setLocationMenuOpen(false);
    setAlertsMenuOpen(false);
    setProfileMenuOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHeaderMenus();
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeHeaderMenus]);

  const loadBootstrap = useCallback(
    async (opts?: { persist?: boolean; outage?: boolean; fixtures?: boolean; city?: string }) => {
      const hasOverride = typeof opts?.outage === 'boolean' || typeof opts?.fixtures === 'boolean';
      const outage = opts?.outage ?? (initializedFromServer.current ? simulateOutage : undefined);
      const fixtures = opts?.fixtures ?? (initializedFromServer.current ? useFixtures : undefined);
      const persist = opts?.persist ?? false;

      setLoading(true);
      setErrorMsg(null);
      try {
        await ensureBrowserSession();
        const payload = await fetchBootstrap({
          city: opts?.city,
          simulateOutage: hasOverride || initializedFromServer.current ? outage : undefined,
          useFixtures: hasOverride || initializedFromServer.current ? fixtures : undefined,
          persist,
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
    [simulateOutage, useFixtures, lang]
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

  const handleLanguageChange = async (nextLang: LanguageCode) => {
    setLang(nextLang);
    if (data?.household) {
      await runAction(() => updateSettingsApi({
        language: nextLang,
        useDemoFixtures: useFixtures,
        simulateOutage,
        defaultCity: data.household.city,
      }));
    }
  };

  const handleToggleFixtures = async (nextEnabled: boolean) => {
    setUseFixtures(nextEnabled);
    if (data?.household) {
      await runAction(() => updateSettingsApi({
        language: lang,
        useDemoFixtures: nextEnabled,
        simulateOutage,
        defaultCity: data.household.city,
      }));
    }
    await loadBootstrap({ outage: simulateOutage, fixtures: nextEnabled });
  };

  const handleToggleOutage = async (nextOutage: boolean) => {
    setSimulateOutage(nextOutage);
    if (data?.household) {
      await runAction(() => updateSettingsApi({
        language: lang,
        useDemoFixtures: useFixtures,
        simulateOutage: nextOutage,
        defaultCity: data.household.city,
      }));
    }
    await loadBootstrap({ outage: nextOutage, fixtures: useFixtures });
  };

  const navigateSection = (target?: string) => {
    closeHeaderMenus();
    if (target === 'family-setup') {
      setFamilySubMode('guided');
      setActiveTab('family');
    } else if (target === 'air-quality-indoor') {
      setAirSubTab('indoor');
      setActiveTab('air-quality');
    } else if (target === 'settings-trust') {
      setSettingsSubTab('methodology');
      setActiveTab('settings');
    } else if (
      target === 'overview' ||
      target === 'family' ||
      target === 'air-quality' ||
      target === 'planner' ||
      target === 'simulator' ||
      target === 'locations' ||
      target === 'reports' ||
      target === 'settings'
    ) {
      if (target === 'family') setFamilySubMode('members');
      if (target === 'air-quality') setAirSubTab('telemetry');
      if (target === 'settings') setSettingsSubTab('preferences');
      setActiveTab(target);
    } else {
      setActiveTab('overview');
    }
    setViewMode('workspace');
  };

  const handleSaveHousehold = async (input: HouseholdInput) => {
    await runAction(() => saveHouseholdApi(input));
    setLang(input.language);
    await loadBootstrap();
  };

  const handleQuickSwitchCity = async (city: string, locality = '') => {
    closeHeaderMenus();
    if (!data?.household) return;
    await handleSaveHousehold({
      name: data.household.name,
      city,
      locality,
      language: lang,
      sensitivityTags: data.household.sensitivityTags,
    });
  };

  const handleAddMember = async (input: FamilyMemberInput) => {
    await runAction(() => addMemberApi(input));
    await loadBootstrap();
  };

  const handleUpdateMember = async (id: string, input: FamilyMemberInput) => {
    await runAction(() => updateMemberApi(id, input));
    await loadBootstrap();
  };

  const handleDeleteMember = async (id: string) => {
    await runAction(() => deleteMemberApi(id));
    await loadBootstrap();
  };

  const handleAddRoutine = async (input: ActivityRoutineInput) => {
    await runAction(() => addRoutineApi(input));
    await loadBootstrap();
  };

  const handleUpdateRoutine = async (id: string, input: ActivityRoutineInput) => {
    await runAction(() => updateRoutineApi(id, input));
    await loadBootstrap();
  };

  const handleToggleRoutineCompletion = async (id: string, completed: boolean) => {
    await runAction(() => toggleRoutineCompletionApi(id, completed));
    await loadBootstrap();
  };

  const handleDeleteRoutine = async (id: string) => {
    await runAction(() => deleteRoutineApi(id));
    await loadBootstrap();
  };

  const handleCreateLocation = async (input: LocationInput) => {
    await runAction(() => createLocationApi(input));
    await loadBootstrap();
  };

  const handleUpdateLocation = async (id: string, input: LocationInput) => {
    await runAction(() => updateLocationApi(id, input));
    await loadBootstrap();
  };

  const handleDeleteLocation = async (id: string) => {
    await runAction(() => deleteLocationApi(id));
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
    const scenarioResult = await runAction(() => runScenarioApi(mod, { simulateOutage, useFixtures }));
    await loadBootstrap();
    return scenarioResult;
  };

  const handleClearLocal = async () => {
    await runAction(() => clearLocalApi());
    setClearedEmpty(true);
    setData(null);
  };

  if (viewMode === 'landing') {
    return (
      <MotionConfig reducedMotion="user">
        <LandingPage
          lang={lang}
          onChangeLang={(next) => void handleLanguageChange(next)}
          onEnterWorkspace={navigateSection}
        />
      </MotionConfig>
    );
  }

  const navItems: Array<{ id: ActiveSection; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: t(lang, 'side_overview'), icon: LayoutDashboard },
    { id: 'family', label: t(lang, 'side_family'), icon: Users },
    { id: 'air-quality', label: t(lang, 'side_air_quality'), icon: Activity },
    { id: 'planner', label: t(lang, 'side_planner'), icon: CalendarClock },
    { id: 'simulator', label: t(lang, 'side_simulator'), icon: SlidersHorizontal },
    { id: 'locations', label: t(lang, 'side_locations'), icon: MapPin },
    { id: 'reports', label: t(lang, 'side_reports'), icon: FileText },
    { id: 'settings', label: t(lang, 'side_settings'), icon: Settings },
  ];

  // Real evidence notices for header bell control
  const activeAlerts: Array<{ title: string; detail: string; kind: 'warn' | 'info' }> = [];
  if (data?.plan.conflictWarningKey && data.plan.conflictDetails) {
    activeAlerts.push({
      title: t(lang, 'rec_conflict_title'),
      detail: data.plan.conflictDetails,
      kind: 'warn',
    });
  }
  if (data && !data.plan.isAvailable) {
    activeAlerts.push({
      title: t(lang, 'dash_unavailable_title'),
      detail: t(lang, 'dash_unavailable_desc'),
      kind: 'warn',
    });
  }
  if (data?.plan.isDemoFixture) {
    activeAlerts.push({
      title: t(lang, 'cls_demo_fixture'),
      detail: t(lang, 'demo_fixture_notice'),
      kind: 'info',
    });
  }

  const savedLocations = data?.locations ?? [];
  const quickCities =
    savedLocations.length > 0
      ? savedLocations
      : [
          {
            id: 'fallback-pune',
            city: data?.household?.city ?? 'Pune',
            locality: data?.household?.locality ?? '',
            label: data?.household?.city ?? 'Pune',
            isPrimary: true,
          },
        ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#F7F7F1] text-[#252D28] flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:sticky lg:top-0 lg:h-screen border-r border-[#E2E7E1] bg-white shrink-0">
          <div className="px-5 h-16 border-b border-[#E2E7E1] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              className="inline-flex items-center gap-2 text-left cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect width="24" height="24" rx="6" fill="#263C32" />
                <path
                  d="M7 14.5C7 10.5 10.5 7 16.5 7C16.5 13 13 16.5 9 16.5C8.1 16.5 7.4 16.2 7 15.8"
                  stroke="#DCE9DD"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
                <path d="M7 17L12 12" stroke="#829C83" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="font-display text-sm font-bold tracking-tight text-[#252D28]">
                {t(lang, 'brandName')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              aria-label={t(lang, 'nav_backToSite')}
              title={t(lang, 'nav_backToSite')}
              className="p-1.5 rounded-md text-[#89918A] hover:text-[#252D28] hover:bg-[#F7F7F1] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.7} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Workspace navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateSection(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all text-left cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#DCE9DD]/75 to-[#DCE9DD]/30 text-[#263C32] shadow-2xs'
                      : 'text-[#89918A] hover:text-[#252D28] hover:bg-[#F7F7F1]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? 'text-[#263C32]' : 'text-[#89918A]'}`}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Household Summary Footer Card */}
          <div className="p-3.5 border-t border-[#E2E7E1]">
            <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3 space-y-2.5">
              <div>
                <p className="text-xs font-semibold text-[#252D28] truncate">
                  {data?.household?.name ?? 'BreatheWise AI'}
                </p>
                <p className="text-[11px] text-[#89918A]">
                  {data?.household?.city ?? 'Pune'} · {data?.members.length ?? 0} {t(lang, 'tab_members').toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-1 pt-2 border-t border-[#E2E7E1]">
                {(['en', 'mr', 'hi'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => void handleLanguageChange(code)}
                    className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      lang === code
                        ? 'bg-[#263C32] text-white'
                        : 'text-[#89918A] hover:text-[#252D28]'
                    }`}
                  >
                    {code === 'en' ? 'EN' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Workspace menu">
            <div
              className="fixed inset-0 bg-[#252D28]/35 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-68 max-w-[84vw] bg-white h-full border-r border-[#E2E7E1] flex flex-col z-10">
              <div className="px-5 h-16 border-b border-[#E2E7E1] flex items-center justify-between">
                <span className="font-display text-sm font-bold text-[#252D28]">
                  {t(lang, 'brandName')}
                </span>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#89918A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigateSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left cursor-pointer ${
                        active ? 'bg-[#DCE9DD]/70 text-[#263C32]' : 'text-[#89918A]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-[#E2E7E1] flex items-center justify-between text-xs text-[#89918A]">
                <span>{data?.household?.city ?? 'Pune'}</span>
                <div className="inline-flex gap-1">
                  {(['en', 'mr', 'hi'] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => void handleLanguageChange(code)}
                      className={`px-2 py-1 rounded-md cursor-pointer ${
                        lang === code
                          ? 'bg-[#263C32] text-white font-medium'
                          : 'text-[#89918A] hover:text-[#252D28]'
                      }`}
                    >
                      {code === 'en' ? 'EN' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-[#E2E7E1] bg-white/95 backdrop-blur-xs h-16 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg border border-[#E2E7E1] text-[#252D28] cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="text-xs text-[#89918A] truncate">
                <span className="text-[#252D28] font-medium">
                  {data?.household?.name ?? 'BreatheWise AI'}
                </span>
                <span aria-hidden="true"> / </span>
                <span>{navItems.find((n) => n.id === activeTab)?.label}</span>
              </div>
            </div>

            {/* Interactive Controls: Dynamic Location Selector, Evidence Alerts, Profile & Refresh */}
            <div className="flex items-center gap-2 shrink-0 relative">
              {data?.household && (
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={locationMenuOpen}
                    aria-label={t(lang, 'ui_location_label')}
                    onClick={() => {
                      setLocationMenuOpen((o) => !o);
                      setAlertsMenuOpen(false);
                      setProfileMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E2E7E1] bg-[#F7F7F1] text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#263C32]" />
                    <span className="hidden sm:inline">{data.household.city}</span>
                    <ChevronDown className="w-3 h-3 text-[#89918A]" />
                  </button>

                  {locationMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-[#E2E7E1] shadow-lg p-1.5 z-30 text-xs">
                      <p className="px-2.5 py-1.5 text-[11px] font-medium text-[#89918A]">
                        {t(lang, 'ui_location_label')}
                      </p>
                      {quickCities.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => void handleQuickSwitchCity(loc.city, loc.locality)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer ${
                            data.household.city === loc.city
                              ? 'bg-[#DCE9DD]/65 font-semibold text-[#263C32]'
                              : 'text-[#252D28] hover:bg-[#F7F7F1]'
                          }`}
                        >
                          <span className="truncate">
                            {loc.city}
                            {loc.label && loc.label !== loc.city ? ` (${loc.label})` : ''}
                          </span>
                          {loc.isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#263C32] shrink-0">
                              Primary
                            </span>
                          )}
                        </button>
                      ))}
                      <div className="my-1 border-t border-[#E2E7E1]" />
                      <button
                        type="button"
                        onClick={() => navigateSection('locations')}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-[#263C32] font-medium hover:bg-[#F7F7F1] cursor-pointer"
                      >
                        {t(lang, 'ui_nav_manage_locations')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Evidence Alerts Popover */}
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={alertsMenuOpen}
                  aria-label={t(lang, 'ui_alerts_title')}
                  onClick={() => {
                    setAlertsMenuOpen((o) => !o);
                    setLocationMenuOpen(false);
                    setProfileMenuOpen(false);
                  }}
                  className="relative p-2 border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#F7F7F1] transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-[#263C32]" strokeWidth={1.7} />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#263C32] text-white text-[10px] font-mono flex items-center justify-center tabular-nums">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>

                {alertsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-white border border-[#E2E7E1] shadow-lg p-3 z-30 space-y-2.5">
                    <p className="text-xs font-semibold text-[#252D28]">
                      {t(lang, 'ui_alerts_title')}
                    </p>
                    {activeAlerts.length === 0 ? (
                      <p className="text-xs text-[#89918A]">{t(lang, 'ui_no_alerts')}</p>
                    ) : (
                      <div className="space-y-2">
                        {activeAlerts.map((alert, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-[#F7F7F1] border border-[#E2E7E1] flex items-start gap-2 text-xs"
                          >
                            {alert.kind === 'warn' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#B4691E] shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-3.5 h-3.5 text-[#263C32] shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-medium text-[#252D28]">{alert.title}</p>
                              <p className="text-[11px] text-[#89918A] mt-0.5">{alert.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => navigateSection('air-quality')}
                      className="w-full py-1.5 text-xs font-medium text-[#263C32] hover:underline cursor-pointer"
                    >
                      {t(lang, 'tab_telemetry')}
                    </button>
                  </div>
                )}
              </div>

              {/* Profile & Language Menu */}
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={profileMenuOpen}
                  aria-label="Household profile and language menu"
                  onClick={() => {
                    setProfileMenuOpen((o) => !o);
                    setLocationMenuOpen(false);
                    setAlertsMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 p-1.5 pr-2.5 border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#F7F7F1] transition-colors cursor-pointer"
                >
                  <span className="w-6 h-6 rounded-md bg-[#263C32] text-[#DCE9DD] flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <span className="hidden md:inline text-xs font-medium uppercase font-mono">
                    {lang}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white border border-[#E2E7E1] shadow-lg p-2 z-30 text-xs space-y-1">
                    <div className="px-2.5 py-2 border-b border-[#E2E7E1]">
                      <p className="font-semibold text-[#252D28] truncate">
                        {data?.household?.name ?? 'Local Household'}
                      </p>
                      <p className="text-[11px] text-[#89918A]">
                        {data?.members.length ?? 0} {t(lang, 'tab_members').toLowerCase()} ·{' '}
                        {data?.household?.city ?? 'Pune'}
                      </p>
                    </div>
                    <div className="flex gap-1 px-1.5 py-1.5">
                      {(['en', 'mr', 'hi'] as const).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => void handleLanguageChange(code)}
                          className={`flex-1 py-1 rounded-md font-medium cursor-pointer ${
                            lang === code
                              ? 'bg-[#263C32] text-white'
                              : 'bg-[#F7F7F1] text-[#89918A] hover:text-[#252D28]'
                          }`}
                        >
                          {code === 'en' ? 'EN' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateSection('family')}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F7F7F1] text-[#252D28] cursor-pointer"
                    >
                      {t(lang, 'side_family')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateSection('settings')}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F7F7F1] text-[#252D28] cursor-pointer"
                    >
                      {t(lang, 'side_settings')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeHeaderMenus();
                        setViewMode('landing');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F7F7F1] text-[#89918A] cursor-pointer"
                    >
                      {t(lang, 'nav_backToSite')}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void loadBootstrap()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#263C32] ${loading ? 'animate-spin' : ''}`}
                  strokeWidth={1.7}
                />
                <span className="hidden sm:inline">{t(lang, 'action_refresh')}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-7">
            {actionError && (
              <div role="alert" aria-live="assertive" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#B33A2E]/35 bg-white px-4 py-3 text-sm text-[#9A2E24] shadow-sm">
                <div><p className="font-semibold">Action could not be completed</p><p className="mt-1 text-xs leading-relaxed">{actionError}</p></div>
                <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error" className="shrink-0 rounded-md p-1 hover:bg-[#F6DFDC] cursor-pointer"><X className="h-4 w-4" /></button>
              </div>
            )}
            {clearedEmpty ? (
              <div className="bg-white border border-[#E2E7E1] rounded-2xl p-10 text-center space-y-4">
                <h2 className="font-display text-lg font-semibold text-[#252D28]">
                  {t(lang, 'action_clearLocal')}
                </h2>
                <p className="text-xs text-[#89918A] max-w-md mx-auto">
                  {t(lang, 'ui_confirm_clear_desc')}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
                >
                  {t(lang, 'action_startOnboarding')}
                </button>
              </div>
            ) : errorMsg ? (
              <div className="bg-white border border-[#B33A2E]/40 rounded-2xl p-6 space-y-3">
                <p className="text-sm font-medium text-[#B33A2E]">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => void loadBootstrap()}
                  className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg cursor-pointer"
                >
                  {t(lang, 'action_refresh')}
                </button>
              </div>
            ) : !data ? (
              <div className="bg-white border border-[#E2E7E1] rounded-2xl p-8 text-xs text-[#89918A]">
                {t(lang, 'loading')}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="bg-white border border-[#E2E7E1] rounded-2xl p-8 text-xs text-[#89918A]">
                    {t(lang, 'loading')}
                  </div>
                }
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {activeTab === 'overview' && (
                      <DashboardView
                        lang={lang}
                        household={data.household}
                        members={data.members}
                        plan={data.plan}
                        primarySnapshot={data.environment.primarySnapshot}
                        forecasts={data.environment.forecasts}
                        onNavigate={navigateSection}
                        onSaveSnapshot={() => loadBootstrap({ persist: true })}
                      />
                    )}
                    {activeTab === 'family' && (
                      <FamilyOnboardingView
                        key={`family-${familySubMode}`}
                        lang={lang}
                        household={data.household}
                        members={data.members}
                        initialMode={familySubMode}
                        onSaveHousehold={handleSaveHousehold}
                        onAddMember={handleAddMember}
                        onUpdateMember={handleUpdateMember}
                        onDeleteMember={handleDeleteMember}
                        onDoneOnboarding={() => navigateSection('overview')}
                      />
                    )}
                    {activeTab === 'air-quality' && (
                      <EnvironmentView
                        key={`air-${airSubTab}`}
                        lang={lang}
                        city={data.household.city}
                        currentBand={data.plan.aqiBand}
                        primarySnapshot={data.environment.primarySnapshot}
                        secondarySnapshots={data.environment.secondarySnapshots}
                        forecasts={data.environment.forecasts}
                        providerStatuses={data.environment.providerStatuses}
                        initialSubTab={airSubTab}
                        onImportCams={handleImportCams}
                      />
                    )}
                    {activeTab === 'planner' && (
                      <PlannerView
                        lang={lang}
                        members={data.members}
                        routines={data.routines}
                        plan={data.plan}
                        forecasts={data.environment.forecasts}
                        onAddRoutine={handleAddRoutine}
                        onUpdateRoutine={handleUpdateRoutine}
                        onToggleCompletion={handleToggleRoutineCompletion}
                        onDeleteRoutine={handleDeleteRoutine}
                        onRecalculatePlan={() => void loadBootstrap({ persist: true })}
                      />
                    )}
                    {activeTab === 'simulator' && (
                      <SimulatorView
                        lang={lang}
                        routines={data.routines}
                        currentPm25={data.environment.primarySnapshot.pollutants.pm25 ?? null}
                        currentPm10={data.environment.primarySnapshot.pollutants.pm10 ?? null}
                        onRunScenario={handleRunScenario}
                      />
                    )}
                    {activeTab === 'locations' && (
                      <ComparisonView
                        lang={lang}
                        activeCity={data.household.city}
                        locations={data.locations}
                        puneSnapshots={data.environment.comparisonCities.pune}
                        ahilyanagarSnapshots={data.environment.comparisonCities.ahilyanagar}
                        byCitySnapshots={data.environment.comparisonCities.byCity}
                        onSwitchHouseholdCity={async (city) => {
                          await handleSaveHousehold({
                            name: data.household.name,
                            city,
                            locality: '',
                            language: lang,
                            sensitivityTags: data.household.sensitivityTags,
                          });
                          navigateSection('overview');
                        }}
                        onCreateLocation={handleCreateLocation}
                        onUpdateLocation={handleUpdateLocation}
                        onDeleteLocation={handleDeleteLocation}
                      />
                    )}
                    {activeTab === 'reports' && (
                      <HistoryView
                        lang={lang}
                        household={data.household}
                        currentPlan={data.plan}
                        plans={data.history.plans}
                        scenarios={data.history.scenarios}
                        snapshots={data.history.snapshots}
                      />
                    )}
                    {activeTab === 'settings' && (
                      <SettingsView
                        key={`settings-${settingsSubTab}`}
                        lang={lang}
                        simulateOutage={simulateOutage}
                        useDemoFixtures={useFixtures}
                        providers={providers}
                        initialSubTab={settingsSubTab}
                        onChangeLang={(next) => void handleLanguageChange(next)}
                        onToggleOutage={(next) => void handleToggleOutage(next)}
                        onToggleDemoFixtures={(next) => void handleToggleFixtures(next)}
                        onClearLocal={handleClearLocal}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
