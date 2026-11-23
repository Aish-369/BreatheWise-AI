// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LanguageCode } from '../src/shared/types';
import { useHouseholdData } from '../src/hooks/useHouseholdData';

const mocks = vi.hoisted(() => ({
  ensureBrowserSession: vi.fn(),
  fetchBootstrap: vi.fn(),
  fetchProvidersApi: vi.fn(),
  setLang: vi.fn(),
  handleLanguageChange: vi.fn(),
}));

vi.mock('../src/utils/api', () => ({
  ensureBrowserSession: mocks.ensureBrowserSession,
  fetchBootstrap: mocks.fetchBootstrap,
  fetchProvidersApi: mocks.fetchProvidersApi,
}));

vi.mock('../src/hooks/useLocale', () => ({
  useLocale: () => ({
    lang: 'en' as LanguageCode,
    setLang: mocks.setLang,
    handleLanguageChange: mocks.handleLanguageChange,
  }),
}));

vi.mock('../src/hooks/useHouseholdMutations', () => ({
  useHouseholdMutations: () => ({
    handleSaveHousehold: vi.fn(),
  }),
}));

describe('useHouseholdData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureBrowserSession.mockResolvedValue({ authenticated: false, household: null });
    mocks.fetchBootstrap.mockResolvedValue({
      household: { language: 'mr' },
      settings: { language: 'mr', simulateOutage: true, useDemoFixtures: true },
    });
    mocks.fetchProvidersApi.mockResolvedValue({ providers: [{ id: 'provider-1' }] });
  });

  it('loads bootstrap data and providers, then applies persisted settings', async () => {
    const payload = {
      household: { language: 'mr' },
      settings: { language: 'mr', simulateOutage: true, useDemoFixtures: true },
    };
    mocks.fetchBootstrap.mockResolvedValue(payload);
    const { result } = renderHook(() => useHouseholdData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mocks.ensureBrowserSession).toHaveBeenCalledTimes(1);
    expect(mocks.fetchBootstrap).toHaveBeenCalledWith({
      city: undefined,
      simulateOutage: undefined,
      useFixtures: undefined,
      persist: false,
    });
    expect(result.current.data).toEqual(payload);
    expect(result.current.providers).toEqual([{ id: 'provider-1' }]);
    expect(result.current.simulateOutage).toBe(true);
    expect(result.current.useFixtures).toBe(true);
    expect(mocks.setLang).toHaveBeenCalledWith('mr');
  });

  it('keeps bootstrap usable when the optional provider registry request fails', async () => {
    mocks.fetchProvidersApi.mockRejectedValue(new Error('Provider service unavailable'));
    const { result } = renderHook(() => useHouseholdData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.errorMsg).toBeNull();
    expect(result.current.providers).toEqual([]);
  });

  it('exposes a bootstrap error and always clears the loading state', async () => {
    mocks.fetchBootstrap.mockRejectedValue(new Error('Bootstrap request failed'));
    const { result } = renderHook(() => useHouseholdData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.errorMsg).toBe('Bootstrap request failed');
  });

  it('clears a previous action error when a new bootstrap request succeeds', async () => {
    const { result } = renderHook(() => useHouseholdData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadBootstrap({ persist: true, city: 'Pune' });
    });

    expect(mocks.fetchBootstrap).toHaveBeenLastCalledWith({
      city: 'Pune',
      simulateOutage: true,
      useFixtures: true,
      persist: true,
    });
    expect(result.current.errorMsg).toBeNull();
  });
});
