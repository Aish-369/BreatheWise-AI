// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import {
  computeActiveAlerts,
  getNavItems,
} from '../src/components/workspace/navConfig';
import { WorkspaceSidebar } from '../src/components/workspace/WorkspaceSidebar';
import { WorkspaceMobileDrawer } from '../src/components/workspace/WorkspaceMobileDrawer';
import { WorkspaceHeader } from '../src/components/workspace/WorkspaceHeader';
import {
  WorkspaceActionError,
  WorkspaceEmptyOrError,
} from '../src/components/workspace/WorkspaceStatusBanner';
import {
  HeaderAlertsMenu,
  HeaderLocationMenu,
  HeaderProfileMenu,
} from '../src/components/workspace/HeaderDropdownMenus';
import type { BootstrapPayload } from '../src/utils/api';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const navItems = getNavItems('en');

describe('workspace navigation configuration', () => {
  it('provides all primary destinations with translated labels', () => {
    expect(navItems.map((item) => item.id)).toEqual([
      'overview',
      'family',
      'air-quality',
      'planner',
      'simulator',
      'locations',
      'reports',
      'settings',
    ]);
    expect(getNavItems('mr')).toHaveLength(8);
    expect(getNavItems('hi')).toHaveLength(8);
    expect(navItems.every((item) => item.label.trim().length > 0)).toBe(true);
  });

  it('derives conflict, unavailable, and demo-fixture alerts independently', () => {
    expect(computeActiveAlerts(null, 'en')).toEqual([]);

    const data = {
      plan: {
        conflictWarningKey: 'rec_conflict_title',
        conflictDetails: 'Provider readings differ',
        isAvailable: false,
        isDemoFixture: true,
      },
    } as BootstrapPayload;

    const alerts = computeActiveAlerts(data, 'en');
    expect(alerts).toHaveLength(3);
    expect(alerts.map((alert) => alert.kind)).toEqual(['warn', 'warn', 'info']);
    expect(alerts.map((alert) => alert.detail)).toContain('Provider readings differ');
  });

  it('does not create a conflict alert without explanatory details', () => {
    const data = {
      plan: {
        conflictWarningKey: 'rec_conflict_title',
        conflictDetails: null,
        isAvailable: true,
        isDemoFixture: false,
      },
    } as BootstrapPayload;

    expect(computeActiveAlerts(data, 'en')).toEqual([]);
  });
});

describe('WorkspaceSidebar', () => {
  it('marks the active destination and delegates navigation and language changes', () => {
    const onNavigate = vi.fn();
    const onBackToLanding = vi.fn();
    const onChangeLang = vi.fn();

    render(
      <WorkspaceSidebar
        lang="en"
        activeTab="planner"
        navItems={navItems}
        householdName="Pawar Family"
        householdCity="Pune"
        memberCount={3}
        onNavigate={onNavigate}
        onBackToLanding={onBackToLanding}
        onChangeLang={onChangeLang}
      />
    );

    expect(screen.getByRole('button', { name: t('en', 'side_planner') }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: t('en', 'side_family') }));
    fireEvent.click(screen.getByRole('button', { name: 'मराठी' }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'nav_backToSite') }));

    expect(onNavigate).toHaveBeenCalledWith('family');
    expect(onChangeLang).toHaveBeenCalledWith('mr');
    expect(onBackToLanding).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Pawar Family')).toBeTruthy();
    expect(screen.getByText(/Pune · 3/)).toBeTruthy();
  });

  it('uses safe household fallbacks when profile data is missing', () => {
    render(
      <WorkspaceSidebar
        lang="en"
        activeTab="overview"
        navItems={navItems}
        memberCount={0}
        onNavigate={vi.fn()}
        onBackToLanding={vi.fn()}
        onChangeLang={vi.fn()}
      />
    );

    expect(screen.getAllByText('BreatheWise AI')).toHaveLength(2);
    expect(screen.getByText(/Pune · 0/)).toBeTruthy();
  });
});

describe('WorkspaceMobileDrawer', () => {
  it('does not mount the modal while closed', () => {
    render(
      <WorkspaceMobileDrawer
        open={false}
        lang="en"
        activeTab="overview"
        navItems={navItems}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onChangeLang={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('navigates, closes, and changes language while open', () => {
    const onClose = vi.fn();
    const onNavigate = vi.fn();
    const onChangeLang = vi.fn();

    render(
      <WorkspaceMobileDrawer
        open
        lang="en"
        activeTab="overview"
        navItems={navItems}
        householdCity="Ahilyanagar"
        onClose={onClose}
        onNavigate={onNavigate}
        onChangeLang={onChangeLang}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Workspace menu' })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('en', 'side_overview') }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: t('en', 'side_planner') }));
    fireEvent.click(screen.getByRole('button', { name: 'हिन्दी' }));

    expect(onNavigate).toHaveBeenCalledWith('planner');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChangeLang).toHaveBeenCalledWith('hi');
    expect(screen.getByText('Ahilyanagar')).toBeTruthy();
  });
});

describe('workspace status and error states', () => {
  it('announces an action error and lets the user dismiss it', () => {
    const onDismiss = vi.fn();
    render(<WorkspaceActionError message="Unable to save the routine." onDismiss={onDismiss} />);

    expect(screen.getByRole('alert').textContent).toContain('Unable to save the routine.');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders a retry action for a recoverable bootstrap error', () => {
    const onRetry = vi.fn();
    render(
      <WorkspaceEmptyOrError
        lang="en"
        clearedEmpty={false}
        errorMsg="Network unavailable"
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_refresh') }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Network unavailable')).toBeTruthy();
  });

  it('shows the empty onboarding state after local data is cleared', () => {
    render(
      <WorkspaceEmptyOrError
        lang="en"
        clearedEmpty
        errorMsg={null}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: t('en', 'action_clearLocal') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('en', 'action_startOnboarding') })).toBeTruthy();
  });

  it('shows a loading state when neither data nor an error is available', () => {
    render(
      <WorkspaceEmptyOrError
        lang="en"
        clearedEmpty={false}
        errorMsg={null}
        onRetry={vi.fn()}
      />
    );
    expect(screen.getByText(t('en', 'loading'))).toBeTruthy();
  });
});

describe('header dropdown menus', () => {
  it('opens the location list and delegates city selection and location management', () => {
    const onToggle = vi.fn();
    const onQuickSwitchCity = vi.fn();
    const onNavigateSection = vi.fn();
    const cities = [
      { id: 'pune', city: 'Pune', locality: 'Shivajinagar', label: 'Home', isPrimary: true },
      { id: 'mumbai', city: 'Mumbai', locality: 'Andheri', label: 'Mumbai', isPrimary: false },
    ];

    render(
      <HeaderLocationMenu
        lang="en"
        activeCity="Pune"
        quickCities={cities}
        open
        onToggle={onToggle}
        onQuickSwitchCity={onQuickSwitchCity}
        onNavigateSection={onNavigateSection}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Pune/ }));
    fireEvent.click(screen.getByRole('button', { name: /Mumbai/ }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'ui_nav_manage_locations') }));

    expect(onQuickSwitchCity).toHaveBeenCalledWith('Pune', 'Shivajinagar');
    expect(onQuickSwitchCity).toHaveBeenCalledWith('Mumbai', 'Andheri');
    expect(onNavigateSection).toHaveBeenCalledWith('locations');
  });

  it('renders an empty alerts message and routes to telemetry', () => {
    const onToggle = vi.fn();
    const onNavigateSection = vi.fn();
    render(
      <HeaderAlertsMenu
        lang="en"
        activeAlerts={[]}
        open
        onToggle={onToggle}
        onNavigateSection={onNavigateSection}
      />
    );

    expect(screen.getByText(t('en', 'ui_no_alerts'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('en', 'tab_telemetry') }));
    expect(onNavigateSection).toHaveBeenCalledWith('air-quality');
  });

  it('renders warning and informational alerts with their count', () => {
    render(
      <HeaderAlertsMenu
        lang="en"
        activeAlerts={[
          { title: 'Conflict', detail: 'Station values differ', kind: 'warn' },
          { title: 'Demo', detail: 'Sample data is active', kind: 'info' },
        ]}
        open
        onToggle={vi.fn()}
        onNavigateSection={vi.fn()}
      />
    );

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('Conflict')).toBeTruthy();
    expect(screen.getByText('Demo')).toBeTruthy();
  });

  it('delegates profile language, navigation, and return actions', () => {
    const onToggle = vi.fn();
    const onChangeLang = vi.fn();
    const onNavigateSection = vi.fn();
    const onBackToLanding = vi.fn();

    render(
      <HeaderProfileMenu
        lang="en"
        data={null}
        open
        onToggle={onToggle}
        onChangeLang={onChangeLang}
        onNavigateSection={onNavigateSection}
        onBackToLanding={onBackToLanding}
      />
    );

    expect(screen.getByText('Local Household')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'मराठी' }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'side_family') }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'side_settings') }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'nav_backToSite') }));

    expect(onChangeLang).toHaveBeenCalledWith('mr');
    expect(onNavigateSection).toHaveBeenNthCalledWith(1, 'family');
    expect(onNavigateSection).toHaveBeenNthCalledWith(2, 'settings');
    expect(onBackToLanding).toHaveBeenCalledTimes(1);
  });
});

describe('WorkspaceHeader', () => {
  it('supports mobile navigation, refresh, and all header menu toggles without household data', () => {
    const onOpenMobileMenu = vi.fn();
    const onToggleLocationMenu = vi.fn();
    const onToggleAlertsMenu = vi.fn();
    const onToggleProfileMenu = vi.fn();
    const onRefresh = vi.fn();

    render(
      <WorkspaceHeader
        lang="en"
        data={null}
        loading
        activeTab="overview"
        navItems={navItems}
        activeAlerts={[]}
        mobileMenuOpen={false}
        locationMenuOpen={false}
        alertsMenuOpen={false}
        profileMenuOpen={false}
        onOpenMobileMenu={onOpenMobileMenu}
        onToggleLocationMenu={onToggleLocationMenu}
        onToggleAlertsMenu={onToggleAlertsMenu}
        onToggleProfileMenu={onToggleProfileMenu}
        onQuickSwitchCity={vi.fn()}
        onNavigateSection={vi.fn()}
        onChangeLang={vi.fn()}
        onBackToLanding={vi.fn()}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'ui_alerts_title') }));
    fireEvent.click(screen.getByRole('button', { name: 'Household profile and language menu' }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_refresh') }));

    expect(onOpenMobileMenu).toHaveBeenCalledTimes(1);
    expect(onToggleAlertsMenu).toHaveBeenCalledTimes(1);
    expect(onToggleProfileMenu).toHaveBeenCalledTimes(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onToggleLocationMenu).not.toHaveBeenCalled();
  });
});
