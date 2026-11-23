// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigationState } from '../src/hooks/useNavigationState';

describe('useNavigationState', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts on the landing page with the default workspace selections', () => {
    const { result } = renderHook(() => useNavigationState());

    expect(result.current.viewMode).toBe('landing');
    expect(result.current.activeTab).toBe('overview');
    expect(result.current.familySubMode).toBe('members');
    expect(result.current.airSubTab).toBe('telemetry');
    expect(result.current.settingsSubTab).toBe('preferences');
    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('maps supported deep links to their intended section and sub-section', () => {
    const { result } = renderHook(() => useNavigationState());

    act(() => result.current.navigateSection('family-setup'));
    expect(result.current.activeTab).toBe('family');
    expect(result.current.familySubMode).toBe('guided');

    act(() => result.current.navigateSection('air-quality-indoor'));
    expect(result.current.activeTab).toBe('air-quality');
    expect(result.current.airSubTab).toBe('indoor');

    act(() => result.current.navigateSection('settings-trust'));
    expect(result.current.activeTab).toBe('settings');
    expect(result.current.settingsSubTab).toBe('methodology');
    expect(result.current.viewMode).toBe('workspace');
  });

  it('accepts valid sections and resets their sub-navigation to the default', () => {
    const { result } = renderHook(() => useNavigationState());

    act(() => result.current.navigateSection('family-setup'));
    act(() => result.current.navigateSection('family'));
    expect(result.current.familySubMode).toBe('members');

    act(() => result.current.navigateSection('air-quality-indoor'));
    act(() => result.current.navigateSection('air-quality'));
    expect(result.current.airSubTab).toBe('telemetry');

    act(() => result.current.navigateSection('settings-trust'));
    act(() => result.current.navigateSection('settings'));
    expect(result.current.settingsSubTab).toBe('preferences');
  });

  it('falls back to overview for unknown targets and closes header menus', () => {
    const { result } = renderHook(() => useNavigationState());

    act(() => {
      result.current.setLocationMenuOpen(true);
      result.current.setAlertsMenuOpen(true);
      result.current.setProfileMenuOpen(true);
      result.current.navigateSection('not-a-real-section');
    });

    expect(result.current.activeTab).toBe('overview');
    expect(result.current.locationMenuOpen).toBe(false);
    expect(result.current.alertsMenuOpen).toBe(false);
    expect(result.current.profileMenuOpen).toBe(false);
    expect(result.current.viewMode).toBe('workspace');
  });

  it('closes header menus and the mobile menu when Escape is pressed', () => {
    const { result } = renderHook(() => useNavigationState());

    act(() => {
      result.current.setLocationMenuOpen(true);
      result.current.setAlertsMenuOpen(true);
      result.current.setProfileMenuOpen(true);
      result.current.setMobileMenuOpen(true);
    });

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));

    expect(result.current.locationMenuOpen).toBe(false);
    expect(result.current.alertsMenuOpen).toBe(false);
    expect(result.current.profileMenuOpen).toBe(false);
    expect(result.current.mobileMenuOpen).toBe(false);
  });

  it('does not close menus for unrelated keyboard events', () => {
    const { result } = renderHook(() => useNavigationState());

    act(() => {
      result.current.setMobileMenuOpen(true);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(result.current.mobileMenuOpen).toBe(true);
  });
});
