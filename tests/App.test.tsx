// @vitest-environment jsdom
import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

const householdActions = vi.hoisted(() => ({
  handleLanguageChange: vi.fn(),
  loadBootstrap: vi.fn(),
}));

vi.mock('../src/hooks/useHouseholdData', () => ({
  useHouseholdData: () => ({
    lang: 'en',
    handleLanguageChange: householdActions.handleLanguageChange,
    loadBootstrap: householdActions.loadBootstrap,
  }),
}));

vi.mock('../src/components/LandingPage', () => ({
  LandingPage: ({
    lang,
    onEnterWorkspace,
    onChangeLang,
  }: {
    lang: string;
    onEnterWorkspace: (target: string) => void;
    onChangeLang: (lang: 'mr') => void;
  }) =>
    createElement(
      'main',
      null,
      createElement('p', null, `Landing language: ${lang}`),
      createElement(
        'button',
        { onClick: () => onEnterWorkspace('overview') },
        'Enter workspace'
      ),
      createElement(
        'button',
        { onClick: () => onChangeLang('mr') },
        'Change language'
      )
    ),
}));

vi.mock('../src/components/workspace/WorkspaceShell', () => ({
  WorkspaceShell: ({
    onBackToLanding,
    onRefresh,
    onChangeLang,
  }: {
    onBackToLanding: () => void;
    onRefresh: () => void;
    onChangeLang: (lang: 'mr') => void;
  }) =>
    createElement(
      'section',
      null,
      createElement('p', null, 'Workspace loaded'),
      createElement('button', { onClick: onBackToLanding }, 'Back to landing'),
      createElement('button', { onClick: onRefresh }, 'Refresh data'),
      createElement(
        'button',
        { onClick: () => onChangeLang('mr') },
        'Workspace language'
      )
    ),
}));

describe('App root routing and action wiring', () => {
  beforeEach(() => {
    householdActions.handleLanguageChange.mockClear();
    householdActions.loadBootstrap.mockClear();
  });

  it('renders the landing page by default', () => {
    render(createElement(App));
    expect(screen.getByText('Landing language: en')).toBeTruthy();
  });

  it('enters the lazy-loaded workspace and wires refresh and back actions', async () => {
    render(createElement(App));

    fireEvent.click(screen.getByRole('button', { name: 'Enter workspace' }));
    expect(await screen.findByText('Workspace loaded')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }));
    expect(householdActions.loadBootstrap).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Back to landing' }));
    await waitFor(() => expect(screen.getByText('Landing language: en')).toBeTruthy());
  });

  it('forwards language changes from the landing page', () => {
    render(createElement(App));
    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    expect(householdActions.handleLanguageChange).toHaveBeenCalledWith('mr');
  });
});
