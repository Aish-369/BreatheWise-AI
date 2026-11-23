import { describe, expect, it } from 'vitest';
import { findCleanerForecastWindow, WINDOW_ORDER } from '../src/engine/plan/windowSelection';
import type { ForecastSlot, TimeWindow } from '../src/shared/types';

function slot(
  timeWindow: TimeWindow,
  expectedPm25: number | null,
  expectedAqiIndia: number | null
): ForecastSlot {
  return {
    id: `slot-${timeWindow}`,
    city: 'Pune',
    timeWindow,
    forecastDate: '2026-11-22',
    expectedPm25,
    expectedPm10: null,
    expectedAqiIndia,
    trend: 'stable',
    dataType: 'forecast',
    providerLabel: 'CAMS',
    gridResolutionNote: 'Coarse grid',
    issuedAt: '2026-11-22T06:00:00.000Z',
    licenseAttribution: 'CAMS',
    isDemoFixture: false,
  };
}

describe('engine/plan/windowSelection', () => {
  it('returns null when forecast slots are empty or contain only invalid negative metrics', () => {
    expect(WINDOW_ORDER).toHaveLength(5);
    expect(findCleanerForecastWindow('06:00-09:00', [], 140, 70)).toBeNull();
    expect(
      findCleanerForecastWindow('06:00-09:00', [slot('12:00-16:00', -1, -5)], 140, 70)
    ).toBeNull();
  });

  it('returns null if current window is already the cleanest slot', () => {
    const result = findCleanerForecastWindow(
      '12:00-16:00',
      [slot('06:00-09:00', 85, 160), slot('12:00-16:00', 38, 65)],
      120,
      65
    );
    expect(result).toBeNull();
  });

  it('requires both >= 18% relative reduction AND >= 8 µg/m³ PM2.5 drop when matching by PM2.5', () => {
    // 25 -> 19 is 24% drop but only 6 µg/m³ delta, and AQI drop 48 -> 40 is only 8 (< 25)
    const tooSmall = findCleanerForecastWindow(
      '06:00-09:00',
      [slot('06:00-09:00', 25, 48), slot('12:00-16:00', 19, 40)],
      48,
      25
    );
    expect(tooSmall).toBeNull();

    // 70 -> 45 is >= 18% and delta = 25 >= 8
    const cleaner = findCleanerForecastWindow(
      '06:00-09:00',
      [slot('06:00-09:00', 70, 130), slot('12:00-16:00', 45, 75)],
      130,
      70
    );
    expect(cleaner?.window).toBe('12:00-16:00');
  });

  it('falls back to AQI improvement (>= 25 drop) and breaks ties by earliest WINDOW_ORDER', () => {
    const byAqi = findCleanerForecastWindow(
      '06:00-09:00',
      [slot('16:00-19:00', null, 80), slot('09:00-12:00', null, 80)],
      120,
      null
    );
    expect(byAqi?.window).toBe('09:00-12:00');
  });
});
