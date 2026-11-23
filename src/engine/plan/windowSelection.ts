import type { ForecastSlot, TimeWindow } from '../../shared/types';

export const WINDOW_ORDER: TimeWindow[] = [
  '06:00-09:00',
  '09:00-12:00',
  '12:00-16:00',
  '16:00-19:00',
  '19:00-22:00',
];

export function findCleanerForecastWindow(
  currentWindow: TimeWindow,
  forecastSlots: ForecastSlot[],
  currentAqi: number | null,
  currentPm25: number | null
): { window: TimeWindow; slot: ForecastSlot } | null {
  if (!forecastSlots || forecastSlots.length === 0) return null;

  const validSlots = forecastSlots.filter(
    (s) =>
      (typeof s.expectedPm25 === 'number' && s.expectedPm25 >= 0) ||
      (typeof s.expectedAqiIndia === 'number' && s.expectedAqiIndia >= 0)
  );
  if (validSlots.length === 0) return null;

  const currentSlot = validSlots.find((s) => s.timeWindow === currentWindow);
  const baselinePm = currentSlot?.expectedPm25 ?? currentPm25;
  const baselineAqi = currentSlot?.expectedAqiIndia ?? currentAqi;

  const sorted = [...validSlots].sort((a, b) => {
    const aScore = a.expectedPm25 ?? a.expectedAqiIndia ?? 999;
    const bScore = b.expectedPm25 ?? b.expectedAqiIndia ?? 999;
    if (aScore !== bScore) return aScore - bScore;
    return WINDOW_ORDER.indexOf(a.timeWindow) - WINDOW_ORDER.indexOf(b.timeWindow);
  });

  const best = sorted[0];
  if (!best || best.timeWindow === currentWindow) return null;

  const pmImproved =
    baselinePm !== null &&
    best.expectedPm25 !== null &&
    best.expectedPm25 <= baselinePm * 0.82 &&
    baselinePm - best.expectedPm25 >= 8;

  const aqiImproved =
    baselineAqi !== null &&
    best.expectedAqiIndia !== null &&
    best.expectedAqiIndia <= baselineAqi - 25;

  return pmImproved || aqiImproved ? { window: best.timeWindow, slot: best } : null;
}
