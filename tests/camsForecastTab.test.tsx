// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import { CamsForecastTab } from '../src/components/environment/CamsForecastTab';
import type { ForecastSlot } from '../src/shared/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const forecasts: ForecastSlot[] = [
  {
    id: 'forecast-1',
    city: 'Pune',
    timeWindow: '06:00-09:00',
    forecastDate: '2026-11-24',
    expectedPm25: 42,
    expectedPm10: 76,
    expectedAqiIndia: 82,
    trend: 'improving',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: 'Coarse 40 km grid',
    issuedAt: '2026-11-23T06:00:00.000Z',
    licenseAttribution: 'Copernicus Atmosphere Monitoring Service',
    isDemoFixture: false,
  },
];

describe('CamsForecastTab', () => {
  it('renders the manual import form and an empty forecast state', () => {
    render(
      <CamsForecastTab
        lang="en"
        city="Pune"
        forecasts={[]}
        onImportCams={vi.fn().mockResolvedValue({ ok: true, message: 'Imported' })}
      />
    );

    expect(screen.getByRole('heading', { name: 'Copernicus CAMS Manual Importer (CSV / JSON)' })).toBeTruthy();
    expect(screen.getByLabelText('Copernicus CAMS CSV or JSON input')).toBeTruthy();
    expect(screen.getByText(t('en', 'ui_chart_import_cams_hint'))).toBeTruthy();
  });

  it('submits pasted data and exposes a successful import status', async () => {
    const onImportCams = vi.fn().mockResolvedValue({ ok: true, message: 'Imported 4 forecast slots.' });
    render(
      <CamsForecastTab lang="en" city="Pune" forecasts={forecasts} onImportCams={onImportCams} />
    );

    expect(screen.getAllByText('06:00-09:00')).toHaveLength(2);
    expect(screen.getByText(/PM2\.5 ~42 µg\/m³ · NAQI 82/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Copernicus CAMS CSV or JSON input'), {
      target: { value: '{"city":"Pune"}' },
    });
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_importCams') }));

    await waitFor(() => expect(onImportCams).toHaveBeenCalledWith('{"city":"Pune"}'));
    expect((await screen.findByRole('status')).textContent).toContain('Imported 4 forecast slots.');
  });

  it('surfaces validation failures returned by the import handler', async () => {
    const onImportCams = vi.fn().mockResolvedValue({ ok: false, message: 'Unsupported time window.' });
    render(<CamsForecastTab lang="en" city="Pune" forecasts={[]} onImportCams={onImportCams} />);

    fireEvent.change(screen.getByLabelText('Copernicus CAMS CSV or JSON input'), {
      target: { value: 'invalid payload' },
    });
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_importCams') }));

    expect((await screen.findByRole('status')).textContent).toContain('Unsupported time window.');
    expect(onImportCams).toHaveBeenCalledWith('invalid payload');
  });

  it('rejects files larger than 512 KB before reading or importing them', () => {
    const onImportCams = vi.fn();
    render(<CamsForecastTab lang="en" city="Pune" forecasts={[]} onImportCams={onImportCams} />);

    const oversized = new File([new Uint8Array(512 * 1024 + 1)], 'large.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(t('en', 'cams_upload_file')), {
      target: { files: [oversized] },
    });

    expect(screen.getByRole('status').textContent).toContain('File exceeds 512 KB limit.');
    expect(onImportCams).not.toHaveBeenCalled();
  });

  it('loads an accepted file into the editor and clears the file input', async () => {
    render(
      <CamsForecastTab
        lang="en"
        city="Pune"
        forecasts={[]}
        onImportCams={vi.fn().mockResolvedValue({ ok: true, message: 'Imported' })}
      />
    );

    const file = new File(['city,timeWindow'], 'forecast.csv', { type: 'text/csv' });
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue('city,timeWindow') });
    const input = screen.getByLabelText(t('en', 'cams_upload_file')) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect((screen.getByLabelText('Copernicus CAMS CSV or JSON input') as HTMLTextAreaElement).value).toBe('city,timeWindow')
    );
    expect(input.value).toBe('');
  });

  it('keeps the import action disabled while the asynchronous import is pending', async () => {
    let resolveImport: ((value: { ok: boolean; message: string }) => void) | undefined;
    const onImportCams = vi.fn(
      () =>
        new Promise<{ ok: boolean; message: string }>((resolve) => {
          resolveImport = resolve;
        })
    );
    render(<CamsForecastTab lang="en" city="Pune" forecasts={[]} onImportCams={onImportCams} />);

    const submit = screen.getByRole('button', { name: t('en', 'action_importCams') });
    fireEvent.click(submit);
    expect((submit as HTMLButtonElement).disabled).toBe(true);

    resolveImport?.({ ok: true, message: 'Done' });
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByRole('status').textContent).toContain('Done');
  });
});
