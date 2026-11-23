import type { DatabaseSync } from 'node:sqlite';
import type { EnvironmentalSnapshot, ForecastSlot, ProviderAdapterStatus } from '../shared/types';
import { fetchAutomaticCamsForecast } from './adapters/camsForecast';
import { getCamsAdapterStatus } from './adapters/camsImporter';
import { fetchCpcbSnapshots } from './adapters/cpcb';
import {
  buildDemoFixtureForCity,
  buildDemoFixtures,
  buildUnavailableSnapshot,
} from './adapters/fixtures';
import { fetchOpenAqSnapshots } from './adapters/openaq';
import { listImportedForecasts, saveSnapshot } from './db';

export interface EnvironmentBundle {
  primarySnapshot: EnvironmentalSnapshot;
  secondarySnapshots: EnvironmentalSnapshot[];
  comparisonCities: {
    pune: EnvironmentalSnapshot[];
    ahilyanagar: EnvironmentalSnapshot[];
    byCity: Record<string, EnvironmentalSnapshot[]>;
  };
  forecasts: ForecastSlot[];
  providerStatuses: ProviderAdapterStatus[];
  mode: 'live' | 'demo_fixture' | 'unavailable';
}

function collectDistinctCities(city: string, extraCities: string[] = []): string[] {
  return Array.from(
    new Map(
      [city, 'Pune', 'Ahilyanagar', ...extraCities]
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => [c.toLowerCase(), c])
    ).values()
  );
}

function buildOutageBundle(
  city: string,
  distinctCities: string[],
  automaticCamsRes: { status: ProviderAdapterStatus; slots: ForecastSlot[] },
  camsStatus: ProviderAdapterStatus,
  nowIso: string
): EnvironmentBundle {
  const byCity: Record<string, EnvironmentalSnapshot[]> = {};
  for (const c of distinctCities) {
    byCity[c] = [buildUnavailableSnapshot(c, `Simulated outage — ${c} stations unavailable.`)];
  }
  return {
    primarySnapshot: buildUnavailableSnapshot(
      city,
      'Simulated provider outage active: live stations unreachable and demo fixtures temporarily disabled.'
    ),
    secondarySnapshots: [],
    comparisonCities: {
      pune: byCity['Pune'] ?? [
        buildUnavailableSnapshot('Pune', 'Simulated outage — Pune stations unavailable.'),
      ],
      ahilyanagar: byCity['Ahilyanagar'] ?? [
        buildUnavailableSnapshot(
          'Ahilyanagar',
          'Simulated outage — Ahilyanagar stations unavailable.'
        ),
      ],
      byCity,
    },
    forecasts: automaticCamsRes.slots,
    providerStatuses: [
      {
        provider: 'cpcb',
        name: 'CPCB / data.gov.in',
        configured: Boolean(process.env.DATA_GOV_IN_API_KEY),
        liveReachable: false,
        status: 'unavailable',
        licenseName: 'Government Open Data License – India (GODL)',
        attributionText: 'Central Pollution Control Board (CPCB) via data.gov.in',
        notes: 'Simulated outage mode active.',
        lastCheckedAt: nowIso,
      },
      {
        provider: 'openaq',
        name: 'OpenAQ API v3',
        configured: Boolean(process.env.OPENAQ_API_KEY),
        liveReachable: false,
        status: 'unavailable',
        licenseName: 'OpenAQ Aggregated Open Data',
        attributionText: 'Data aggregated via OpenAQ',
        notes: 'Simulated outage mode active.',
        lastCheckedAt: nowIso,
      },
      automaticCamsRes.status,
      camsStatus,
    ],
    mode: 'unavailable',
  };
}

function selectCitySnapshotsWithFallback(
  cityName: string,
  live: EnvironmentalSnapshot[],
  fixtures: ReturnType<typeof buildDemoFixtures>,
  useDemoFixtures: boolean,
  nowIso: string
): EnvironmentalSnapshot[] {
  if (live.length > 0) return live;
  if (useDemoFixtures) {
    const fx = fixtures.snapshots.filter((s) => s.city.toLowerCase() === cityName.toLowerCase());
    return fx.length > 0 ? fx : [buildDemoFixtureForCity(cityName, nowIso).snapshot];
  }
  return [
    buildUnavailableSnapshot(
      cityName,
      `Live providers unconfigured; fixtures disabled for ${cityName}.`
    ),
  ];
}

async function resolveCityComparisonMap(
  db: DatabaseSync,
  activeCity: string,
  distinctCities: string[],
  liveSnapshots: EnvironmentalSnapshot[],
  fixtures: ReturnType<typeof buildDemoFixtures>,
  useDemoFixtures: boolean,
  nowIso: string
): Promise<Record<string, EnvironmentalSnapshot[]>> {
  const byCity: Record<string, EnvironmentalSnapshot[]> = {};
  for (const c of distinctCities) {
    if (c.toLowerCase() === activeCity.toLowerCase()) {
      byCity[c] = selectCitySnapshotsWithFallback(
        c,
        liveSnapshots,
        fixtures,
        useDemoFixtures,
        nowIso
      );
      continue;
    }
    const [extraOaq, extraCpcb] = await Promise.all([
      fetchOpenAqSnapshots(c),
      fetchCpcbSnapshots(c),
    ]);
    const extraLive = [...extraCpcb.snapshots, ...extraOaq.snapshots].filter((s) => s.isAvailable);
    for (const snap of extraLive) saveSnapshot(db, snap);
    byCity[c] = selectCitySnapshotsWithFallback(c, extraLive, fixtures, useDemoFixtures, nowIso);
  }
  return byCity;
}

function selectForecastsForCity(
  city: string,
  importedForecasts: ForecastSlot[],
  automaticForecasts: ForecastSlot[],
  fixtureForecasts: ForecastSlot[],
  useDemoFixtures: boolean,
  nowIso: string,
  includeCityFallback: boolean
): ForecastSlot[] {
  const cityLower = city.toLowerCase();
  const imported = importedForecasts.filter((f) => f.city.toLowerCase() === cityLower);
  if (imported.length > 0) return imported;
  if (automaticForecasts.length > 0) return automaticForecasts;
  if (!useDemoFixtures) return [];
  const matched = fixtureForecasts.filter((f) => f.city.toLowerCase() === cityLower);
  if (matched.length > 0) return matched;
  return includeCityFallback ? buildDemoFixtureForCity(city, nowIso).forecasts : [];
}

export async function resolveEnvironmentBundle(
  db: DatabaseSync,
  city: string,
  options: {
    householdId?: string;
    simulateOutage?: boolean;
    useDemoFixtures?: boolean;
    extraCities?: string[];
  } = {}
): Promise<EnvironmentBundle> {
  const nowIso = new Date().toISOString();
  const useDemoFixtures = options.useDemoFixtures ?? false;
  const simulateOutage = options.simulateOutage ?? false;
  const camsStatus = getCamsAdapterStatus();
  const automaticCamsPromise = fetchAutomaticCamsForecast(city);
  const distinctCities = collectDistinctCities(city, options.extraCities);

  if (simulateOutage) {
    return buildOutageBundle(city, distinctCities, await automaticCamsPromise, camsStatus, nowIso);
  }

  const [openaqRes, cpcbRes, automaticCamsRes] = await Promise.all([
    fetchOpenAqSnapshots(city),
    fetchCpcbSnapshots(city),
    automaticCamsPromise,
  ]);
  const liveSnapshots = [...cpcbRes.snapshots, ...openaqRes.snapshots].filter((s) => s.isAvailable);
  for (const snap of liveSnapshots) saveSnapshot(db, snap);

  const fixtures = buildDemoFixtures(nowIso);
  const importedForecasts = listImportedForecasts(db, undefined, options.householdId);
  const automaticForecasts = automaticCamsRes.slots;
  const byCity = await resolveCityComparisonMap(
    db,
    city,
    distinctCities,
    liveSnapshots,
    fixtures,
    useDemoFixtures,
    nowIso
  );

  const comparisonCities = {
    pune:
      byCity['Pune'] ??
      selectCitySnapshotsWithFallback('Pune', [], fixtures, useDemoFixtures, nowIso),
    ahilyanagar:
      byCity['Ahilyanagar'] ??
      selectCitySnapshotsWithFallback('Ahilyanagar', [], fixtures, useDemoFixtures, nowIso),
    byCity,
  };
  const providerStatuses = [cpcbRes.status, openaqRes.status, automaticCamsRes.status, camsStatus];

  if (liveSnapshots.length > 0) {
    return {
      primarySnapshot: liveSnapshots[0],
      secondarySnapshots: liveSnapshots.slice(1),
      comparisonCities,
      forecasts: selectForecastsForCity(
        city,
        importedForecasts,
        automaticForecasts,
        fixtures.forecasts,
        useDemoFixtures,
        nowIso,
        false
      ),
      providerStatuses,
      mode: 'live',
    };
  }

  if (useDemoFixtures) {
    const matchingFixtures = fixtures.snapshots.filter(
      (s) => s.city.toLowerCase() === city.toLowerCase()
    );
    const resolvedDemoSnapshots =
      matchingFixtures.length > 0
        ? matchingFixtures
        : [buildDemoFixtureForCity(city, nowIso).snapshot];
    for (const snap of resolvedDemoSnapshots) saveSnapshot(db, snap);

    return {
      primarySnapshot: resolvedDemoSnapshots[0],
      secondarySnapshots: resolvedDemoSnapshots.slice(1),
      comparisonCities,
      forecasts: selectForecastsForCity(
        city,
        importedForecasts,
        automaticForecasts,
        fixtures.forecasts,
        true,
        nowIso,
        true
      ),
      providerStatuses,
      mode: 'demo_fixture',
    };
  }

  const imported = importedForecasts.filter((f) => f.city.toLowerCase() === city.toLowerCase());
  return {
    primarySnapshot: buildUnavailableSnapshot(
      city,
      `No live environmental feed is configured and no verified station coverage is loaded for ${city}.`
    ),
    secondarySnapshots: [],
    comparisonCities,
    forecasts: imported.length > 0 ? imported : automaticForecasts,
    providerStatuses,
    mode: 'unavailable',
  };
}
