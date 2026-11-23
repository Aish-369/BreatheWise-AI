// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LanguageCode } from '../src/shared/types';
import App from '../src/App';

const mocks = vi.hoisted(() => ({
  handleLanguageChange: vi.fn(),
  loadBootstrap: vi.fn(),
}));

vi.mock('../src/hooks/useHouseholdData', () => ({
  useHouseholdData: () => ({
    lang: 'en' as LanguageCode,
    handleLanguageChange: mocks.handleLanguageChange,
    loadBootstrap: mocks.loadBootstrap,
  }),
}));

vi.mock('../src/components/LandingPage', () => ({
  LandingPage: ({
    onChangeLang,
    onEnterWorkspace,
  }: {
    onChangeLang: (lang: LanguageCode) => void;
    onEnterWorkspace: (section?: string) => void;
  }) => (
    <main>
      <h1>Landing test view</h1>
      <button onClick={() => onEnterWorkspace('family')}>Enter family workspace</button>
      <button onClick={() => onChangeLang('mr')}>Switch to Marathi</button>
    </main>
  ),
}));

vi.mock('../src/components/workspace/WorkspaceShell', () => ({
  WorkspaceShell: ({
    nav,
    onBackToLanding,
    onRefresh,
  }: {
    nav: { activeTab: string };
    onBackToLanding: () => void;
    onRefresh: () => void;
  }) => (
    <main>
      <h1>Workspace section: {nav.activeTab}</h1>
      <button onClick={onBackToLanding}>Back to landing</button>
      <button onClick={onRefresh}>Refresh workspace</button>
    </main>
  ),
}));

describe('App root routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the landing view first and opens the selected workspace section', async () => {
    render(<App />);

    expect(screen.getByText('Landing test view')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enter family workspace' }));

    expect(await screen.findByText('Workspace section: family')).toBeTruthy();
  });

  it('returns from the lazy workspace shell to the landing view', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter family workspace' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Back to landing' }));

    expect(screen.getByText('Landing test view')).toBeTruthy();
  });

  it('delegates language changes and workspace refresh to the household data hook', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Marathi' }));
    expect(mocks.handleLanguageChange).toHaveBeenCalledWith('mr');

    fireEvent.click(screen.getByRole('button', { name: 'Enter family workspace' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Refresh workspace' }));

    expect(mocks.loadBootstrap).toHaveBeenCalledTimes(1);
  });
});
