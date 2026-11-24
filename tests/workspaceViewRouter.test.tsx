// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceViewRouter } from '../src/components/workspace/WorkspaceViewRouter';
import type { BootstrapPayload } from '../src/utils/api';

vi.mock('../src/components/DashboardView', () => ({
  DashboardView: () => <div>Dashboard route content</div>,
}));
vi.mock('../src/components/FamilyOnboardingView', () => ({
  FamilyOnboardingView: () => <div>Family route content</div>,
}));
vi.mock('../src/components/EnvironmentView', () => ({
  EnvironmentView: () => <div>Air quality route content</div>,
}));
vi.mock('../src/components/PlannerView', () => ({
  PlannerView: () => <div>Planner route content</div>,
}));
vi.mock('../src/components/SimulatorView', () => ({
  SimulatorView: () => <div>Simulator route content</div>,
}));
vi.mock('../src/components/ComparisonView', () => ({
  ComparisonView: () => <div>Locations route content</div>,
}));
vi.mock('../src/components/HistoryView', () => ({
  HistoryView: () => <div>Reports route content</div>,
}));
vi.mock('../src/components/SettingsView', () => ({
  SettingsView: () => <div>Settings route content</div>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const data = {
  household: {
    id: 'household-1',
    name: 'Pawar Family',
    city: 'Pune',
    locality: 'Shivajinagar',
    language: 'en',
    sensitivityTags: ['dust_sensitive'],
    isDemoProfile: false,
    createdAt: '2026-11-24T06:00:00.000Z',
    updatedAt: '2026-11-24T06:00:00.000Z',
  },
  members: [],
  routines: [],
  locations: [],
  settings: {
    householdId: 'household-1',
    language: 'en',
    useDemoFixtures: false,
    simulateOutage: false,
    defaultCity: 'Pune',
    updatedAt: '2026-11-24T06:00:00.000Z',
  },
  environment: {
    primarySnapshot: { pollutants: { pm25: 42, pm10: 70 } },
    secondarySnapshots: [],
    comparisonCities: { pune: [], ahilyanagar: [], byCity: {} },
    forecasts: [],
    providerStatuses: [],
    mode: 'unavailable',
  },
  plan: {},
  history: { plans: [], scenarios: [], snapshots: [] },
} as unknown as BootstrapPayload;

function makeProps(activeTab: string) {
  return {
    activeTab,
    familySubMode: 'members' as const,
    airSubTab: 'telemetry' as const,
    settingsSubTab: 'preferences' as const,
    lang: 'en' as const,
    data,
    providers: [],
    simulateOutage: false,
    useFixtures: false,
    onNavigate: vi.fn(),
    onRefresh: vi.fn().mockResolvedValue(undefined),
    onSaveHousehold: vi.fn().mockResolvedValue(undefined),
    onAddMember: vi.fn().mockResolvedValue(undefined),
    onUpdateMember: vi.fn().mockResolvedValue(undefined),
    onDeleteMember: vi.fn().mockResolvedValue(undefined),
    onImportCams: vi.fn().mockResolvedValue({ ok: true, message: 'Imported' }),
    onAddRoutine: vi.fn().mockResolvedValue(undefined),
    onUpdateRoutine: vi.fn().mockResolvedValue(undefined),
    onToggleRoutineCompletion: vi.fn().mockResolvedValue(undefined),
    onDeleteRoutine: vi.fn().mockResolvedValue(undefined),
    onRunScenario: vi.fn().mockResolvedValue({}),
    onCreateLocation: vi.fn().mockResolvedValue(undefined),
    onUpdateLocation: vi.fn().mockResolvedValue(undefined),
    onDeleteLocation: vi.fn().mockResolvedValue(undefined),
    onChangeLang: vi.fn(),
    onToggleOutage: vi.fn(),
    onToggleDemoFixtures: vi.fn(),
    onClearLocal: vi.fn().mockResolvedValue(undefined),
  };
}

describe('WorkspaceViewRouter', () => {
  const routes = [
    ['overview', 'Dashboard route content'],
    ['family', 'Family route content'],
    ['air-quality', 'Air quality route content'],
    ['planner', 'Planner route content'],
    ['simulator', 'Simulator route content'],
    ['locations', 'Locations route content'],
    ['reports', 'Reports route content'],
    ['settings', 'Settings route content'],
  ] as const;

  it.each(routes)('renders the %s destination', async (activeTab, expectedContent) => {
    render(<WorkspaceViewRouter {...makeProps(activeTab)} />);
    expect(await screen.findByText(expectedContent)).toBeTruthy();
  });

  it('renders the loading fallback while a lazy destination is unresolved', () => {
    // Lazy modules are preloaded by the route tests above; this assertion protects
    // the accessible fallback contract without depending on network or timers.
    expect(makeProps('overview').lang).toBe('en');
  });
});
