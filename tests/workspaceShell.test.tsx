// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import { useNavigationState } from '../src/hooks/useNavigationState';
import type { useHouseholdData } from '../src/hooks/useHouseholdData';
import type { BootstrapPayload } from '../src/utils/api';
import { WorkspaceShell } from '../src/components/workspace/WorkspaceShell';

vi.mock('../src/components/workspace/WorkspaceViewRouter', () => ({
  WorkspaceViewRouter: () => <div>Routed workspace content</div>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const bootstrapData = {
  household: {
    id: 'household-1',
    name: 'Pawar Family',
    city: 'Pune',
    locality: 'Shivajinagar',
    language: 'en',
    sensitivityTags: ['dust_sensitive'],
  },
  members: [{ id: 'member-1', name: 'Asha' }],
  locations: [
    {
      id: 'loc-pune',
      city: 'Pune',
      locality: 'Shivajinagar',
      label: 'Home',
      isPrimary: true,
      latitude: 18.52,
      longitude: 73.85,
    },
    {
      id: 'loc-mumbai',
      city: 'Mumbai',
      locality: 'Andheri',
      label: 'Office',
      isPrimary: false,
      latitude: 19.07,
      longitude: 72.87,
    },
  ],
  plan: {
    isAvailable: true,
    isDemoFixture: false,
    conflictWarningKey: null,
    conflictDetails: null,
  },
} as unknown as BootstrapPayload;

function makeHouseholdState(overrides: Record<string, unknown> = {}) {
  return {
    data: null,
    providers: [],
    loading: false,
    errorMsg: null,
    actionError: null,
    setActionError: vi.fn(),
    clearedEmpty: false,
    simulateOutage: false,
    useFixtures: false,
    lang: 'en' as const,
    loadBootstrap: vi.fn().mockResolvedValue(undefined),
    handleSaveHousehold: vi.fn().mockResolvedValue(undefined),
    handleAddMember: vi.fn().mockResolvedValue(undefined),
    handleUpdateMember: vi.fn().mockResolvedValue(undefined),
    handleDeleteMember: vi.fn().mockResolvedValue(undefined),
    handleImportCams: vi.fn().mockResolvedValue({ ok: true, message: 'Imported' }),
    handleAddRoutine: vi.fn().mockResolvedValue(undefined),
    handleUpdateRoutine: vi.fn().mockResolvedValue(undefined),
    handleToggleRoutineCompletion: vi.fn().mockResolvedValue(undefined),
    handleDeleteRoutine: vi.fn().mockResolvedValue(undefined),
    handleRunScenario: vi.fn().mockResolvedValue({}),
    handleCreateLocation: vi.fn().mockResolvedValue(undefined),
    handleUpdateLocation: vi.fn().mockResolvedValue(undefined),
    handleDeleteLocation: vi.fn().mockResolvedValue(undefined),
    handleToggleOutage: vi.fn().mockResolvedValue(undefined),
    handleToggleFixtures: vi.fn().mockResolvedValue(undefined),
    handleClearLocal: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ReturnType<typeof useHouseholdData>;
}

function Harness({
  hh,
  onChangeLang = vi.fn(),
  onBackToLanding = vi.fn(),
  onRefresh = vi.fn(),
}: {
  hh: ReturnType<typeof useHouseholdData>;
  onChangeLang?: (lang: 'en' | 'mr' | 'hi') => void;
  onBackToLanding?: () => void;
  onRefresh?: () => void;
}) {
  const nav = useNavigationState();
  return (
    <WorkspaceShell
      nav={nav}
      hh={hh}
      onChangeLang={onChangeLang}
      onBackToLanding={onBackToLanding}
      onRefresh={onRefresh}
    />
  );
}

describe('WorkspaceShell orchestration', () => {
  it('shows the bootstrap loading state when there is no data yet', () => {
    render(<Harness hh={makeHouseholdState({ loading: true })} />);
    expect(screen.getByText(t('en', 'loading'))).toBeTruthy();
    expect(screen.getByText('BreatheWise AI')).toBeTruthy();
  });

  it('renders routed content and dismisses action errors', () => {
    const setActionError = vi.fn();
    render(
      <Harness
        hh={makeHouseholdState({
          data: bootstrapData,
          actionError: 'Unable to save this routine.',
          setActionError,
        })}
      />
    );

    expect(screen.getByText('Routed workspace content')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Unable to save this routine.');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));
    expect(setActionError).toHaveBeenCalledWith(null);
  });

  it('opens only one header menu at a time and closes all menus on Escape', () => {
    render(<Harness hh={makeHouseholdState({ data: bootstrapData })} />);

    fireEvent.click(screen.getByRole('button', { name: t('en', 'ui_alerts_title') }));
    expect(screen.getByText(t('en', 'ui_no_alerts'))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Household profile and language menu' }));
    expect(screen.queryByText(t('en', 'ui_no_alerts'))).toBeNull();
    expect(screen.getByText('Pawar Family')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Pawar Family')).toBeNull();
  });

  it('quick-switches household city using the saved location and closes the menu', async () => {
    const hh = makeHouseholdState({ data: bootstrapData });
    render(<Harness hh={hh} />);

    fireEvent.click(screen.getByRole('button', { name: t('en', 'ui_location_label') }));
    fireEvent.click(screen.getByRole('button', { name: /Mumbai/ }));

    await waitFor(() =>
      expect(hh.handleSaveHousehold).toHaveBeenCalledWith({
        name: 'Pawar Family',
        city: 'Mumbai',
        locality: 'Andheri',
        language: 'en',
        sensitivityTags: ['dust_sensitive'],
      })
    );
    expect(screen.queryByRole('button', { name: /Mumbai/ })).toBeNull();
  });

  it('opens the mobile drawer, navigates, and closes it after selection', () => {
    render(<Harness hh={makeHouseholdState({ data: bootstrapData })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.getByRole('dialog', { name: 'Workspace menu' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t('en', 'side_planner') }));
    expect(screen.queryByRole('dialog', { name: 'Workspace menu' })).toBeNull();
    expect(
      screen.getByRole('button', { name: t('en', 'side_planner') }).getAttribute('aria-current')
    ).toBe('page');
  });

  it('shows the cleared-data state instead of routing when local data was cleared', () => {
    render(
      <Harness
        hh={makeHouseholdState({
          data: bootstrapData,
          clearedEmpty: true,
        })}
      />
    );

    expect(screen.queryByText('Routed workspace content')).toBeNull();
    expect(screen.getByRole('button', { name: t('en', 'action_startOnboarding') })).toBeTruthy();
  });

  it('shows a recoverable bootstrap error and delegates retry', () => {
    const onRefresh = vi.fn();
    render(
      <Harness
        hh={makeHouseholdState({ errorMsg: 'Service unavailable' })}
        onRefresh={onRefresh}
      />
    );

    expect(screen.getByText('Service unavailable')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_refresh') }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
