// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { t } from '../src/i18n/translations';
import type { SavedLocation } from '../src/shared/types';
import { SavedLocationsPanel } from '../src/components/comparison/SavedLocationsPanel';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const home = {
  id: 'location-home',
  label: 'Home',
  city: 'Pune',
  locality: 'Shivajinagar',
  isPrimary: true,
  latitude: 18.5204,
  longitude: 73.8567,
} as SavedLocation;

const office = {
  id: 'location-office',
  label: 'Office',
  city: 'Mumbai',
  locality: 'Andheri',
  isPrimary: false,
  latitude: 19.076,
  longitude: 72.8777,
} as SavedLocation;

describe('SavedLocationsPanel add, edit, and primary-location workflows', () => {
  it('adds a selected Indian city with metadata and a custom label', async () => {
    const onCreateLocation = vi.fn().mockResolvedValue(undefined);

    render(
      <SavedLocationsPanel
        lang="en"
        locations={[home]}
        onCreateLocation={onCreateLocation}
        onUpdateLocation={vi.fn().mockResolvedValue(undefined)}
        onDeleteLocation={vi.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.change(screen.getByLabelText(t('en', 'ui_search_city_placeholder')), {
      target: { value: 'Pune' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: t('en', 'ui_location_label') }), {
      target: { value: 'Pune' },
    });
    fireEvent.change(screen.getByLabelText(t('en', 'ui_location_label_input')), {
      target: { value: 'Family Annex' },
    });
    fireEvent.change(screen.getByLabelText(t('en', 'ui_locality_optional')), {
      target: { value: 'Kothrud' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: t('en', 'action_set_primary') }));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_add') }));

    await waitFor(() =>
      expect(onCreateLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Pune',
          locality: 'Kothrud',
          label: 'Family Annex',
          isPrimary: true,
          latitude: expect.any(Number),
          longitude: expect.any(Number),
        })
      )
    );
  });

  it('edits a saved location label and locality', async () => {
    const onUpdateLocation = vi.fn().mockResolvedValue(undefined);

    render(
      <SavedLocationsPanel
        lang="en"
        locations={[home, office]}
        onCreateLocation={vi.fn().mockResolvedValue(undefined)}
        onUpdateLocation={onUpdateLocation}
        onDeleteLocation={vi.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: `${t('en', 'action_edit')} Home` }));
    fireEvent.change(screen.getAllByLabelText(t('en', 'ui_location_label_input'))[0], {
      target: { value: 'Family Home' },
    });
    fireEvent.change(screen.getAllByLabelText(t('en', 'ui_locality_optional'))[0], {
      target: { value: 'Koregaon Park' },
    });
    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_save_edit') }));

    await waitFor(() =>
      expect(onUpdateLocation).toHaveBeenCalledWith('location-home', {
        city: 'Pune',
        locality: 'Koregaon Park',
        label: 'Family Home',
        isPrimary: true,
        latitude: 18.5204,
        longitude: 73.8567,
      })
    );
  });

  it('sets a secondary saved location as the household primary city', () => {
    const onUpdateLocation = vi.fn().mockResolvedValue(undefined);

    render(
      <SavedLocationsPanel
        lang="en"
        locations={[home, office]}
        onCreateLocation={vi.fn().mockResolvedValue(undefined)}
        onUpdateLocation={onUpdateLocation}
        onDeleteLocation={vi.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: t('en', 'action_set_primary') }));
    expect(onUpdateLocation).toHaveBeenCalledWith(
      'location-office',
      expect.objectContaining({
        city: 'Mumbai',
        locality: 'Andheri',
        isPrimary: true,
      })
    );
  });

  it('deletes a location only when more than one saved location exists', () => {
    const onDeleteLocation = vi.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <SavedLocationsPanel
        lang="en"
        locations={[home, office]}
        onCreateLocation={vi.fn().mockResolvedValue(undefined)}
        onUpdateLocation={vi.fn().mockResolvedValue(undefined)}
        onDeleteLocation={onDeleteLocation}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: `${t('en', 'action_delete')} Office` }));
    expect(onDeleteLocation).toHaveBeenCalledWith('location-office');

    rerender(
      <SavedLocationsPanel
        lang="en"
        locations={[home]}
        onCreateLocation={vi.fn().mockResolvedValue(undefined)}
        onUpdateLocation={vi.fn().mockResolvedValue(undefined)}
        onDeleteLocation={onDeleteLocation}
      />
    );

    expect(screen.queryByRole('button', { name: `${t('en', 'action_delete')} Home` })).toBeNull();
  });

  it('keeps the add-location form available when there are no saved locations', () => {
    render(
      <SavedLocationsPanel
        lang="en"
        locations={[]}
        onCreateLocation={vi.fn().mockResolvedValue(undefined)}
        onUpdateLocation={vi.fn().mockResolvedValue(undefined)}
        onDeleteLocation={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(
      screen.getByRole('heading', { name: `${t('en', 'ui_saved_locations_title')} (0)` })
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: t('en', 'ui_add_location_title') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t('en', 'action_add') })).toBeTruthy();
  });
});
