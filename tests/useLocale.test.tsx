// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HouseholdProfile } from '../src/shared/types';
import { useLocale } from '../src/hooks/useLocale';

const { updateSettingsApi } = vi.hoisted(() => ({
  updateSettingsApi: vi.fn(),
}));

vi.mock('../src/utils/api', () => ({ updateSettingsApi }));

const household: HouseholdProfile = {
  id: 'hh-locale-test',
  name: 'Test Household',
  city: 'Pune',
  locality: 'Kothrud',
  language: 'en',
  isDemoProfile: false,
  createdAt: '2026-11-20T08:00:00.000Z',
  updatedAt: '2026-11-20T08:00:00.000Z',
};

describe('useLocale', () => {
  beforeEach(() => {
    updateSettingsApi.mockReset();
    updateSettingsApi.mockResolvedValue(undefined);
  });

  it('initializes with English', () => {
    const { result } = renderHook(() =>
      useLocale({
        household,
        useFixtures: false,
        simulateOutage: false,
        runAction: async (action) => action(),
      })
    );

    expect(result.current.lang).toBe('en');
  });

  it('changes language and persists all current settings for an existing household', async () => {
    const runAction = vi.fn(async (action: () => Promise<unknown>) => action());
    const { result } = renderHook(() =>
      useLocale({
        household,
        useFixtures: true,
        simulateOutage: true,
        runAction,
      })
    );

    await act(async () => {
      await result.current.handleLanguageChange('mr');
    });

    expect(result.current.lang).toBe('mr');
    expect(runAction).toHaveBeenCalledTimes(1);
    expect(updateSettingsApi).toHaveBeenCalledWith({
      language: 'mr',
      useDemoFixtures: true,
      simulateOutage: true,
      defaultCity: 'Pune',
    });
  });

  it('updates the selected language without making a persistence call when no household exists', async () => {
    const runAction = vi.fn(async (action: () => Promise<unknown>) => action());
    const { result } = renderHook(() =>
      useLocale({
        household: null,
        useFixtures: false,
        simulateOutage: false,
        runAction,
      })
    );

    await act(async () => {
      await result.current.handleLanguageChange('hi');
    });

    expect(result.current.lang).toBe('hi');
    expect(runAction).not.toHaveBeenCalled();
    expect(updateSettingsApi).not.toHaveBeenCalled();
  });

  it('propagates persistence errors through the supplied action handler', async () => {
    const failure = new Error('Settings save failed');
    const runAction = vi.fn(async (action: () => Promise<unknown>) => action());
    updateSettingsApi.mockRejectedValueOnce(failure);

    const { result } = renderHook(() =>
      useLocale({
        household,
        useFixtures: false,
        simulateOutage: false,
        runAction,
      })
    );

    await expect(
      act(async () => {
        await result.current.handleLanguageChange('mr');
      })
    ).rejects.toThrow('Settings save failed');
    expect(result.current.lang).toBe('mr');
  });
});
