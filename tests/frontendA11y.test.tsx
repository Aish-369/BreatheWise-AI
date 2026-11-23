// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ComparisonView } from '../src/components/ComparisonView';
import { DashboardView } from '../src/components/DashboardView';
import { EnvironmentView } from '../src/components/EnvironmentView';
import { FamilyOnboardingView } from '../src/components/FamilyOnboardingView';
import { HistoryView } from '../src/components/HistoryView';
import { LandingPage } from '../src/components/LandingPage';
import { PlannerView } from '../src/components/PlannerView';
import { SettingsView } from '../src/components/SettingsView';
import { SimulatorView } from '../src/components/SimulatorView';
import { generateProtectionPlan, runWhatIfScenario } from '../src/engine/intelligence';
import { buildDemoFixtures } from '../src/server/adapters/fixtures';
import type {
  ActivityRoutine,
  DataProviderRecord,
  FamilyMember,
  HouseholdProfile,
  SavedLocation,
} from '../src/shared/types';

const NOW = '2026-11-22T09:00:00.000Z';

beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string): MediaQueryList => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

afterEach(() => {
  cleanup();
});

const household: HouseholdProfile = {
  id: 'hh-a11y',
  name: 'Deshmukh Family',
  city: 'Pune',
  locality: 'Shivajinagar',
  language: 'en',
  sensitivityTags: ['dust_sensitive'],
  isDemoProfile: true,
  createdAt: NOW,
  updatedAt: NOW,
};

const members: FamilyMember[] = [
  {
    id: 'm1',
    householdId: 'hh-a11y',
    name: 'Aarav',
    ageGroup: 'school_child',
    activityPreference: 'outdoor_play',
    routineFlexibility: 'fixed',
    createdAt: NOW,
  },
  {
    id: 'm2',
    householdId: 'hh-a11y',
    name: 'Meera',
    ageGroup: 'older_adult',
    activityPreference: 'morning_walk',
    routineFlexibility: 'flexible',
    createdAt: NOW,
  },
];

const routines: ActivityRoutine[] = [
  {
    id: 'r1',
    householdId: 'hh-a11y',
    title: 'Morning Walk',
    environment: 'outdoor',
    flexibility: 'flexible',
    preferredWindow: '06:00-09:00',
    memberIds: ['m2'],
    createdAt: NOW,
  },
];

const locations: SavedLocation[] = [
  {
    id: 'loc1',
    householdId: 'hh-a11y',
    city: 'Pune',
    locality: 'Shivajinagar',
    label: 'Pune · Shivajinagar',
    isPrimary: true,
    latitude: 18.53,
    longitude: 73.85,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'loc2',
    householdId: 'hh-a11y',
    city: 'Ahilyanagar',
    locality: 'Savedi',
    label: 'Ahilyanagar · Savedi',
    isPrimary: false,
    latitude: 19.1,
    longitude: 74.74,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const providers: DataProviderRecord[] = [
  {
    id: 'cpcb',
    name: 'CPCB Ambient Air Monitoring',
    baseUrl: 'https://api.data.gov.in',
    requiresApiKey: true,
    status: 'live',
    notes: 'Government Open Data License India',
    updatedAt: NOW,
    licenses: [
      {
        id: 'lic-cpcb',
        providerId: 'cpcb',
        licenseName: 'GODL India',
        attributionText: 'CPCB via data.gov.in',
        licenseUrl: 'https://data.gov.in',
        commercialAllowed: true,
        attributionRequired: true,
      },
    ],
  },
];

const providerStatuses = [
  {
    provider: 'cpcb' as const,
    name: 'CPCB Ambient Air Monitoring',
    configured: true,
    liveReachable: true,
    status: 'live' as const,
    licenseName: 'GODL India',
    attributionText: 'CPCB via data.gov.in',
    notes: 'Station monitor',
    lastCheckedAt: NOW,
  },
];

const fixtures = buildDemoFixtures();
const puneSnap = fixtures.snapshots.find((s) => s.city === 'Pune')!;
const ahilyaSnap = fixtures.snapshots.find((s) => s.city === 'Ahilyanagar')!;
const plan = generateProtectionPlan({
  household,
  members,
  routines,
  primarySnapshot: puneSnap,
  forecastSlots: fixtures.forecasts,
  nowIso: NOW,
});
const scenario = runWhatIfScenario(
  {
    household,
    members,
    routines,
    primarySnapshot: puneSnap,
    forecastSlots: fixtures.forecasts,
    nowIso: NOW,
  },
  { label: 'Spike', pm25Override: 165 }
);

async function expectNoAxeViolations(node: ReactNode, inMainLandmark = true) {
  const { container } = render(inMainLandmark ? <main>{node}</main> : <>{node}</>);
  const results = await axe(container);
  expect(results.violations).toEqual([]);
}

describe('Frontend WCAG accessibility audit (jest-axe)', () => {
  const noop = async () => {};

  it('LandingPage passes axe checks with zero violations', async () => {
    await expectNoAxeViolations(
      <LandingPage lang="en" onChangeLang={() => {}} onEnterWorkspace={() => {}} />,
      false
    );
  });

  it('DashboardView passes axe checks with zero violations', async () => {
    await expectNoAxeViolations(
      <DashboardView
        lang="en"
        household={household}
        members={members}
        plan={plan}
        primarySnapshot={puneSnap}
        forecasts={fixtures.forecasts}
        onNavigate={() => {}}
        onSaveSnapshot={() => {}}
      />
    );
  });

  it('FamilyOnboardingView passes axe checks in both members and guided wizard modes', async () => {
    await expectNoAxeViolations(
      <FamilyOnboardingView
        lang="en"
        household={household}
        members={members}
        initialMode="members"
        onSaveHousehold={noop}
        onAddMember={noop}
        onUpdateMember={noop}
        onDeleteMember={noop}
        onDoneOnboarding={() => {}}
      />
    );
    cleanup();
    await expectNoAxeViolations(
      <FamilyOnboardingView
        lang="en"
        household={household}
        members={members}
        initialMode="guided"
        onSaveHousehold={noop}
        onAddMember={noop}
        onUpdateMember={noop}
        onDeleteMember={noop}
        onDoneOnboarding={() => {}}
      />
    );
  });

  it('PlannerView and SimulatorView pass axe checks with zero violations', async () => {
    await expectNoAxeViolations(
      <PlannerView
        lang="en"
        members={members}
        routines={routines}
        plan={plan}
        forecasts={fixtures.forecasts}
        onAddRoutine={noop}
        onUpdateRoutine={noop}
        onToggleCompletion={noop}
        onDeleteRoutine={noop}
        onRecalculatePlan={() => {}}
      />
    );
    cleanup();
    await expectNoAxeViolations(
      <SimulatorView
        lang="en"
        routines={routines}
        currentPm25={puneSnap.pollutants.pm25 ?? null}
        currentPm10={puneSnap.pollutants.pm10 ?? null}
        onRunScenario={async () => scenario}
      />
    );
  });

  it('ComparisonView and EnvironmentView pass axe checks with zero violations', async () => {
    await expectNoAxeViolations(
      <ComparisonView
        lang="en"
        activeCity="Pune"
        locations={locations}
        puneSnapshots={[puneSnap]}
        ahilyanagarSnapshots={[ahilyaSnap]}
        byCitySnapshots={{ Pune: [puneSnap], Ahilyanagar: [ahilyaSnap] }}
        onSwitchHouseholdCity={noop}
        onCreateLocation={noop}
        onUpdateLocation={noop}
        onDeleteLocation={noop}
      />
    );
    cleanup();
    await expectNoAxeViolations(
      <EnvironmentView
        lang="en"
        city="Pune"
        currentBand={plan.aqiBand}
        primarySnapshot={puneSnap}
        secondarySnapshots={[]}
        forecasts={fixtures.forecasts}
        providerStatuses={providerStatuses}
        initialSubTab="telemetry"
        onImportCams={async () => ({ ok: true, message: 'Imported' })}
      />
    );
  });

  it('HistoryView and SettingsView pass axe checks with zero violations', async () => {
    await expectNoAxeViolations(
      <HistoryView
        lang="en"
        household={household}
        currentPlan={plan}
        plans={[plan]}
        scenarios={[scenario]}
        snapshots={[puneSnap, ahilyaSnap]}
      />
    );
    cleanup();
    await expectNoAxeViolations(
      <SettingsView
        lang="en"
        simulateOutage={false}
        useDemoFixtures={true}
        providers={providers}
        initialSubTab="preferences"
        onChangeLang={() => {}}
        onToggleOutage={() => {}}
        onToggleDemoFixtures={() => {}}
        onClearLocal={noop}
      />
    );
  });
});
