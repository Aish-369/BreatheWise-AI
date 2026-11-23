import type { EnvironmentalSnapshot, ForecastSlot } from '../../shared/types';
import { buildPuneForecasts } from './fixtures/cityForecasts';
import {
  buildAhilyanagarSnapshot,
  buildPunePashanSnapshot,
  buildPuneShivajinagarSnapshot,
} from './fixtures/citySnapshots';

export { buildDemoFixtureForCity, buildUnavailableSnapshot } from './fixtures/cityFallback';

export function buildDemoFixtures(nowIso: string = new Date().toISOString()): {
  snapshots: EnvironmentalSnapshot[];
  forecasts: ForecastSlot[];
} {
  return {
    snapshots: [
      buildPuneShivajinagarSnapshot(nowIso),
      buildPunePashanSnapshot(nowIso),
      buildAhilyanagarSnapshot(nowIso),
    ],
    forecasts: buildPuneForecasts(nowIso),
  };
}
