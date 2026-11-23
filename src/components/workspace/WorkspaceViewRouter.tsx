import { lazy, Suspense, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  ActivityRoutineInput,
  DataProviderRecord,
  FamilyMemberInput,
  HouseholdInput,
  LanguageCode,
  LocationInput,
  ScenarioComparisonResult,
  ScenarioModification,
} from '../../shared/types';
import type { BootstrapPayload } from '../../utils/api';
import { t } from '../../i18n/translations';
import type { ActiveSection } from '../../hooks/useNavigationState';

const DashboardView = lazy(() =>
  import('../DashboardView').then((m) => ({ default: m.DashboardView }))
);
const FamilyOnboardingView = lazy(() =>
  import('../FamilyOnboardingView').then((m) => ({ default: m.FamilyOnboardingView }))
);
const EnvironmentView = lazy(() =>
  import('../EnvironmentView').then((m) => ({ default: m.EnvironmentView }))
);
const PlannerView = lazy(() => import('../PlannerView').then((m) => ({ default: m.PlannerView })));
const SimulatorView = lazy(() =>
  import('../SimulatorView').then((m) => ({ default: m.SimulatorView }))
);
const ComparisonView = lazy(() =>
  import('../ComparisonView').then((m) => ({ default: m.ComparisonView }))
);
const HistoryView = lazy(() => import('../HistoryView').then((m) => ({ default: m.HistoryView })));
const SettingsView = lazy(() =>
  import('../SettingsView').then((m) => ({ default: m.SettingsView }))
);

interface WorkspaceViewRouterProps {
  activeTab: ActiveSection;
  familySubMode: 'members' | 'guided';
  airSubTab: 'telemetry' | 'indoor' | 'forecast';
  settingsSubTab: 'preferences' | 'methodology';
  lang: LanguageCode;
  data: BootstrapPayload;
  providers: DataProviderRecord[];
  simulateOutage: boolean;
  useFixtures: boolean;
  onNavigate: (target?: string) => void;
  onRefresh: (opts?: { persist?: boolean }) => Promise<void>;
  onSaveHousehold: (input: HouseholdInput) => Promise<void>;
  onAddMember: (input: FamilyMemberInput) => Promise<void>;
  onUpdateMember: (id: string, input: FamilyMemberInput) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onImportCams: (rawText: string) => Promise<{ ok: boolean; message: string }>;
  onAddRoutine: (input: ActivityRoutineInput) => Promise<void>;
  onUpdateRoutine: (id: string, input: ActivityRoutineInput) => Promise<void>;
  onToggleRoutineCompletion: (id: string, completed: boolean) => Promise<void>;
  onDeleteRoutine: (id: string) => Promise<void>;
  onRunScenario: (mod: ScenarioModification) => Promise<ScenarioComparisonResult>;
  onCreateLocation: (input: LocationInput) => Promise<void>;
  onUpdateLocation: (id: string, input: LocationInput) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
  onChangeLang: (lang: LanguageCode) => void;
  onToggleOutage: (next: boolean) => void;
  onToggleDemoFixtures: (next: boolean) => void;
  onClearLocal: () => Promise<void>;
}

export function WorkspaceViewRouter(props: WorkspaceViewRouterProps) {
  const { activeTab, data, lang } = props;

  const viewMap: Record<ActiveSection, () => ReactNode> = {
    overview: () => (
      <DashboardView
        lang={lang}
        household={data.household}
        members={data.members}
        plan={data.plan}
        primarySnapshot={data.environment.primarySnapshot}
        forecasts={data.environment.forecasts}
        onNavigate={props.onNavigate}
        onSaveSnapshot={() => void props.onRefresh({ persist: true })}
      />
    ),
    family: () => (
      <FamilyOnboardingView
        key={`family-${props.familySubMode}`}
        lang={lang}
        household={data.household}
        members={data.members}
        initialMode={props.familySubMode}
        onSaveHousehold={props.onSaveHousehold}
        onAddMember={props.onAddMember}
        onUpdateMember={props.onUpdateMember}
        onDeleteMember={props.onDeleteMember}
        onDoneOnboarding={() => props.onNavigate('overview')}
      />
    ),
    'air-quality': () => (
      <EnvironmentView
        key={`air-${props.airSubTab}`}
        lang={lang}
        city={data.household.city}
        currentBand={data.plan.aqiBand}
        primarySnapshot={data.environment.primarySnapshot}
        secondarySnapshots={data.environment.secondarySnapshots}
        forecasts={data.environment.forecasts}
        providerStatuses={data.environment.providerStatuses}
        initialSubTab={props.airSubTab}
        onImportCams={props.onImportCams}
      />
    ),
    planner: () => (
      <PlannerView
        lang={lang}
        members={data.members}
        routines={data.routines}
        plan={data.plan}
        forecasts={data.environment.forecasts}
        onAddRoutine={props.onAddRoutine}
        onUpdateRoutine={props.onUpdateRoutine}
        onToggleCompletion={props.onToggleRoutineCompletion}
        onDeleteRoutine={props.onDeleteRoutine}
        onRecalculatePlan={() => void props.onRefresh({ persist: true })}
      />
    ),
    simulator: () => (
      <SimulatorView
        lang={lang}
        routines={data.routines}
        currentPm25={data.environment.primarySnapshot.pollutants.pm25 ?? null}
        currentPm10={data.environment.primarySnapshot.pollutants.pm10 ?? null}
        onRunScenario={props.onRunScenario}
      />
    ),
    locations: () => (
      <ComparisonView
        lang={lang}
        activeCity={data.household.city}
        locations={data.locations}
        puneSnapshots={data.environment.comparisonCities.pune}
        ahilyanagarSnapshots={data.environment.comparisonCities.ahilyanagar}
        byCitySnapshots={data.environment.comparisonCities.byCity}
        onSwitchHouseholdCity={async (city) => {
          await props.onSaveHousehold({
            name: data.household.name,
            city,
            locality: '',
            language: lang,
            sensitivityTags: data.household.sensitivityTags,
          });
          props.onNavigate('overview');
        }}
        onCreateLocation={props.onCreateLocation}
        onUpdateLocation={props.onUpdateLocation}
        onDeleteLocation={props.onDeleteLocation}
      />
    ),
    reports: () => (
      <HistoryView
        lang={lang}
        household={data.household}
        currentPlan={data.plan}
        plans={data.history.plans}
        scenarios={data.history.scenarios}
        snapshots={data.history.snapshots}
      />
    ),
    settings: () => (
      <SettingsView
        key={`settings-${props.settingsSubTab}`}
        lang={lang}
        simulateOutage={props.simulateOutage}
        useDemoFixtures={props.useFixtures}
        providers={props.providers}
        initialSubTab={props.settingsSubTab}
        onChangeLang={props.onChangeLang}
        onToggleOutage={props.onToggleOutage}
        onToggleDemoFixtures={props.onToggleDemoFixtures}
        onClearLocal={props.onClearLocal}
      />
    ),
  };

  return (
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
          {viewMap[activeTab]()}
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}
