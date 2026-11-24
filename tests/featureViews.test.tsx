// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import { IndoorGuidanceView } from '../src/components/IndoorGuidanceView';
import { TrustView } from '../src/components/TrustView';
import { SettingsView } from '../src/components/SettingsView';

vi.mock('../src/components/settings/PreferencesPanel', () => ({
  PreferencesPanel: ({
    onChangeLang,
    onToggleOutage,
    onToggleDemoFixtures,
    onRequestClear,
  }: {
    onChangeLang: (lang: 'en' | 'mr' | 'hi') => void;
    onToggleOutage: (next: boolean) => void;
    onToggleDemoFixtures: (next: boolean) => void;
    onRequestClear: () => void;
  }) => (
    <section>
      <button onClick={() => onChangeLang('mr')}>Change language</button>
      <button onClick={() => onToggleOutage(true)}>Enable outage simulation</button>
      <button onClick={() => onToggleDemoFixtures(true)}>Enable sample data</button>
      <button onClick={onRequestClear}>Request clear data</button>
    </section>
  ),
}));

vi.mock('../src/components/settings/ConfirmClearModal', () => ({
  ConfirmClearModal: ({
    open,
    onCancel,
    onConfirm,
  }: {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <section role="dialog" aria-label="Confirm clear data">
        <button onClick={onCancel}>Cancel clear</button>
        <button onClick={onConfirm}>Confirm clear</button>
      </section>
    ) : null,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('IndoorGuidanceView', () => {
  it('clearly labels outdoor conditions as unavailable when there is no verified reading', () => {
    render(<IndoorGuidanceView lang="en" currentBand="unavailable" city="Pune" />);

    expect(screen.getByRole('heading', { name: 'Outdoor air data is unavailable' })).toBeTruthy();
    expect(screen.getByText('Data unavailable')).toBeTruthy();
    expect(screen.getByText(/No verified outdoor station measurement is available/)).toBeTruthy();
  });

  it('shows high-pollution guidance for poor outdoor conditions', () => {
    render(<IndoorGuidanceView lang="en" currentBand="poor" city="Pune" />);

    expect(screen.getByText(t('en', 'indoor_hero_high'))).toBeTruthy();
    expect(screen.getByText(t('en', 'indoor_badge_closed'))).toBeTruthy();
  });

  it('shows moderate guidance for lower pollution bands', () => {
    render(<IndoorGuidanceView lang="en" currentBand="moderate" city="Pune" />);

    expect(screen.getByText(t('en', 'indoor_hero_mod'))).toBeTruthy();
    expect(screen.getByText(t('en', 'indoor_badge_nonpeak'))).toBeTruthy();
  });

  it('avoids suggesting outdoor active travel when AQI is moderate or worse', () => {
    render(<IndoorGuidanceView lang="en" currentBand="poor" city="Pune" />);

    expect(screen.getByText(t('en', 'low_emission_caution'))).toBeTruthy();
    expect(screen.getByText(t('en', 'sustainable_impact_note'))).toBeTruthy();
  });

  it('allows walking or cycling only with a verified lower-AQI condition', () => {
    render(<IndoorGuidanceView lang="en" currentBand="good" city="Pune" />);

    expect(screen.getByText(t('en', 'low_emission_clear'))).toBeTruthy();
  });

  it.each(['en', 'mr', 'hi'] as const)('localizes sustainable guidance in %s', (lang) => {
    render(<IndoorGuidanceView lang={lang} currentBand="moderate" city="Pune" />);

    expect(screen.getByRole('heading', { name: t(lang, 'sustainable_choices_title') })).toBeTruthy();
    expect(screen.getByRole('heading', { name: t(lang, 'sustainable_swaps_title') })).toBeTruthy();
  });
});

describe('TrustView', () => {
  it('renders the four provenance tiers, safeguards, and provider registry', () => {
    render(<TrustView lang="en" providers={[]} />);

    expect(screen.getByText(t('en', 'trust_safeguards_title'))).toBeTruthy();
    expect(screen.getByText(t('en', 'trust_tier_station'))).toBeTruthy();
    expect(screen.getByText(t('en', 'trust_tier_bulletin'))).toBeTruthy();
    expect(screen.getByText(t('en', 'trust_tier_forecast'))).toBeTruthy();
    expect(screen.getByText(t('en', 'trust_tier_scenario'))).toBeTruthy();
  });
});

describe('SettingsView', () => {
  const props = {
    lang: 'en' as const,
    simulateOutage: false,
    useDemoFixtures: false,
    providers: [] as import('../src/shared/types').DataProviderRecord[],
    onChangeLang: vi.fn(),
    onToggleOutage: vi.fn(),
    onToggleDemoFixtures: vi.fn(),
    onClearLocal: vi.fn().mockResolvedValue(undefined),
  };

  it('switches between preferences and methodology tabs', () => {
    render(<SettingsView {...props} />);

    fireEvent.click(screen.getByRole('button', { name: t('en', 'tab_methodology') }));
    expect(screen.getByText(t('en', 'trust_safeguards_title'))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t('en', 'tab_preferences') }));
    expect(screen.getByRole('button', { name: 'Change language' })).toBeTruthy();
  });

  it('delegates preference actions to the supplied callbacks', () => {
    render(<SettingsView {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enable outage simulation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enable sample data' }));

    expect(props.onChangeLang).toHaveBeenCalledWith('mr');
    expect(props.onToggleOutage).toHaveBeenCalledWith(true);
    expect(props.onToggleDemoFixtures).toHaveBeenCalledWith(true);
  });

  it('requires confirmation before clearing local data and then calls the clear handler', async () => {
    render(<SettingsView {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Request clear data' }));
    expect(screen.getByRole('dialog', { name: 'Confirm clear data' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm clear' }));

    expect(props.onClearLocal).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Confirm clear data' })).toBeNull();
  });

  it('allows cancelling the clear-data confirmation without clearing data', () => {
    render(<SettingsView {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Request clear data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel clear' }));

    expect(props.onClearLocal).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Confirm clear data' })).toBeNull();
  });
});
