// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import { AqiGauge } from '../src/components/AqiGauge';
import { ForecastTrendChart } from '../src/components/ForecastTrendChart';
import { PollutantBreakdownChart } from '../src/components/PollutantBreakdownChart';
import { EnvironmentView } from '../src/components/EnvironmentView';
import type {
  EnvironmentalSnapshot,
  ForecastSlot,
  Pollutants,
  ProviderAdapterStatus,
} from '../src/shared/types';

vi.mock('../src/components/environment/DataAvailabilityBanner', () => ({
  DataAvailabilityBanner: ({ onViewForecast }: { onViewForecast: () => void }) => (
    <button onClick={onViewForecast}>Open forecast from availability notice</button>
  ),
}));
vi.mock('../src/components/environment/CamsForecastTab', () => ({
  CamsForecastTab: () => <div>Forecast tab content</div>,
}));
vi.mock('../src/components/environment/TelemetryStationTab', () => ({
  TelemetryStationTab: () => <div>Telemetry tab content</div>,
}));
vi.mock('../src/components/IndoorGuidanceView', () => ({
  IndoorGuidanceView: () => <div>Indoor guidance content</div>,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AqiGauge', () => {
  it('communicates unavailable readings without presenting a numeric AQI', () => {
    render(
      <AqiGauge aqi={null} band="unavailable" bandLabel="Unavailable" isAvailable={false} />
    );

    expect(screen.getByRole('img', { name: 'AQI Unavailable' })).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText('Unavailable')).toBeTruthy();
  });

  it('renders the available AQI value and band in compact mode', () => {
    render(
      <AqiGauge aqi={82} band="satisfactory" bandLabel="Satisfactory" isAvailable size="sm" />
    );

    expect(screen.getByRole('img', { name: 'AQI 82 Satisfactory' })).toBeTruthy();
    expect(screen.getByText('82')).toBeTruthy();
    expect(screen.getByText('Satisfactory')).toBeTruthy();
  });
});

describe('ForecastTrendChart', () => {
  const forecast = {
    id: 'forecast-1',
    city: 'Pune',
    timeWindow: '06:00-09:00',
    forecastDate: '2026-11-24',
    expectedPm25: 42,
    expectedPm10: 70,
    expectedAqiIndia: 76,
    trend: 'improving',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: 'Coarse grid',
    issuedAt: '2026-11-23T06:00:00.000Z',
    licenseAttribution: 'CAMS',
  } as ForecastSlot;

  it('shows a useful empty state when no PM2.5 forecast exists', () => {
    render(<ForecastTrendChart slots={[]} city="Pune" />);

    expect(screen.getByText(t('en', 'ui_chart_import_cams_hint'))).toBeTruthy();
    expect(screen.getByText(t('en', 'ui_chart_pm25_no_forecast', { city: 'Pune' }))).toBeTruthy();
  });

  it('shows the forecast summary and switches between curve and bar views', () => {
    render(<ForecastTrendChart slots={[forecast]} city="Pune" />);

    expect(screen.getByText(/42 µg\/m³/)).toBeTruthy();

    const bars = screen.getByRole('button', { name: t('en', 'ui_bar_view') });
    fireEvent.click(bars);
    expect(bars.getAttribute('aria-pressed')).toBe('true');

    const curve = screen.getByRole('button', { name: t('en', 'ui_curve_view') });
    fireEvent.click(curve);
    expect(curve.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('PollutantBreakdownChart', () => {
  const pollutants: Pollutants = {
    pm25: 75,
    pm10: 120,
    no2: 35,
    o3: null,
    so2: 12,
    co: 0.8,
  };

  it('renders pollutant values, missing-value labels, and station navigation', () => {
    const onInspectStation = vi.fn();
    render(
      <PollutantBreakdownChart
        pollutants={pollutants}
        locationLabel="Pune station"
        lang="en"
        onInspectStation={onInspectStation}
      />
    );

    expect(screen.getByText('Pune station')).toBeTruthy();
    expect(screen.getByText('75')).toBeTruthy();
    expect(screen.getByText('120')).toBeTruthy();
    expect(screen.getByText(t('en', 'ui_not_reported'))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t('en', 'tab_telemetry') }));
    expect(onInspectStation).toHaveBeenCalledTimes(1);
  });

  it('renders without an optional station navigation action', () => {
    render(
      <PollutantBreakdownChart
        pollutants={{ pm25: null }}
        locationLabel="No station"
        lang="en"
      />
    );

    expect(screen.getByText('No station')).toBeTruthy();
    expect(screen.queryByRole('button', { name: t('en', 'tab_telemetry') })).toBeNull();
  });
});

describe('EnvironmentView', () => {
  const snapshot = {
    id: 'snapshot-1',
    provider: 'unavailable',
    providerLabel: 'Unavailable',
    dataType: 'physical_station',
    classification: 'unavailable',
    city: 'Pune',
    locationLabel: 'Pune',
    stationOrGridId: 'none',
    spatialResolutionNote: '',
    pollutants: {},
    measuredAt: null,
    retrievedAt: '2026-11-23T00:00:00.000Z',
    freshness: 'unavailable',
    licenseAttribution: '',
    warnings: [],
    isAvailable: false,
  } as EnvironmentalSnapshot;

  const providerStatuses: ProviderAdapterStatus[] = [];

  it('starts on telemetry and navigates across forecast and indoor tabs', () => {
    const onImportCams = vi.fn().mockResolvedValue({ ok: true, message: 'Imported' });
    render(
      <EnvironmentView
        lang="en"
        city="Pune"
        currentBand="unavailable"
        primarySnapshot={snapshot}
        secondarySnapshots={[]}
        forecasts={[]}
        providerStatuses={providerStatuses}
        onImportCams={onImportCams}
      />
    );

    expect(screen.getByText('Telemetry tab content')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('en', 'tab_forecast') }));
    expect(screen.getByText('Forecast tab content')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t('en', 'tab_indoor') }));
    expect(screen.getByText('Indoor guidance content')).toBeTruthy();
  });

  it('opens forecast when requested by the data availability notice', () => {
    render(
      <EnvironmentView
        lang="en"
        city="Pune"
        currentBand="moderate"
        primarySnapshot={snapshot}
        secondarySnapshots={[]}
        forecasts={[]}
        providerStatuses={providerStatuses}
        onImportCams={vi.fn().mockResolvedValue({ ok: true, message: 'Imported' })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open forecast from availability notice' }));
    expect(screen.getByText('Forecast tab content')).toBeTruthy();
  });

  it('honours a forecast initial sub-tab', () => {
    render(
      <EnvironmentView
        lang="en"
        city="Pune"
        currentBand="moderate"
        primarySnapshot={snapshot}
        secondarySnapshots={[]}
        forecasts={[]}
        providerStatuses={providerStatuses}
        initialSubTab="forecast"
        onImportCams={vi.fn().mockResolvedValue({ ok: true, message: 'Imported' })}
      />
    );

    expect(screen.getByText('Forecast tab content')).toBeTruthy();
  });
});
