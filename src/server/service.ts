import type { DatabaseSync } from 'node:sqlite';
import { generateProtectionPlan, runWhatIfScenario } from '../engine/intelligence';
import type {
  EnvironmentalSnapshot,
  ForecastSlot,
  HouseholdProfile,
  ProtectionPlanResult,
  ProviderAdapterStatus,
  ScenarioComparisonResult,
  ScenarioModification,
} from '../shared/types';
import { getCamsAdapterStatus } from './adapters/camsImporter';
import { fetchCpcbSnapshots } from './adapters/cpcb';
import { buildDemoFixtures, buildUnavailableSnapshot } from './adapters/fixtures';
import { fetchOpenAqSnapshots } from './adapters/openaq';
import {
  getActiveHousehold,
  getUserSettings,
  listImportedForecasts,
  listLocations,
  listMembers,
  listPlanHistory,
  listRoutines,
  listScenarioRuns,
  listSnapshots,
  savePlanHistory,
  saveScenarioRun,
  saveSnapshot,
  seedDemoHouseholdIfEmpty,
} from './db';

export interface EnvironmentBundle {
  primarySnapshot: EnvironmentalSnapshot;
  secondarySnapshots: EnvironmentalSnapshot[];
  comparisonCities: {
    pune: EnvironmentalSnapshot[];
    ahilyanagar: EnvironmentalSnapshot[];
  };
  forecasts: ForecastSlot[];
  providerStatuses: ProviderAdapterStatus[];
  mode: 'live' | 'demo_fixture' | 'unavailable';
}

export async function resolveEnvironmentBundle(
  db: DatabaseSync,
  city: string,
  options: { simulateOutage?: boolean; useDemoFixtures?: boolean } = {}
): Promise<EnvironmentBundle> {
  const nowIso = new Date().toISOString();
  const useDemoFixtures = options.useDemoFixtures ?? true;
  const simulateOutage = options.simulateOutage ?? false;

  const camsStatus = getCamsAdapterStatus();

  if (simulateOutage) {
    const unavailablePrimary = buildUnavailableSnapshot(
      city,
      'Simulated provider outage active: live stations unreachable and demo fixtures temporarily disabled.'
    );
    return {
      primarySnapshot: unavailablePrimary,
      secondarySnapshots: [],
      comparisonCities: {
        pune: [buildUnavailableSnapshot('Pune', 'Simulated outage — Pune stations unavailable.')],
        ahilyanagar: [buildUnavailableSnapshot('Ahilyanagar', 'Simulated outage — Ahilyanagar stations unavailable.')],
      },
      forecasts: [],
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
        camsStatus,
      ],
      mode: 'unavailable',
    };
  }

  const [openaqRes, cpcbRes] = await Promise.all([
    fetchOpenAqSnapshots(city),
    fetchCpcbSnapshots(city),
  ]);

  const liveSnapshots = [...cpcbRes.snapshots, ...openaqRes.snapshots].filter((s) => s.isAvailable);
  for (const snap of liveSnapshots) {
    saveSnapshot(db, snap);
  }

  const fixtures = buildDemoFixtures(nowIso);
  const importedForecasts = listImportedForecasts(db);

  const puneFixtures = fixtures.snapshots.filter((s) => s.city.toLowerCase() === 'pune');
  const ahilyanagarFixtures = fixtures.snapshots.filter(
    (s) => s.city.toLowerCase() === 'ahilyanagar'
  );

  if (liveSnapshots.length > 0) {
    const primary = liveSnapshots[0];
    const secondary = liveSnapshots.slice(1);
    const cityForecasts = importedForecasts.filter(
      (f) => f.city.toLowerCase() === city.toLowerCase()
    );
    const mergedForecasts =
      cityForecasts.length > 0
        ? cityForecasts
        : useDemoFixtures
          ? fixtures.forecasts.filter((f) => f.city.toLowerCase() === city.toLowerCase())
          : [];

    return {
      primarySnapshot: primary,
      secondarySnapshots: secondary,
      comparisonCities: {
        pune: city.toLowerCase() === 'pune' ? liveSnapshots : puneFixtures,
        ahilyanagar:
          city.toLowerCase() === 'ahilyanagar' ? liveSnapshots : ahilyanagarFixtures,
      },
      forecasts: mergedForecasts,
      providerStatuses: [cpcbRes.status, openaqRes.status, camsStatus],
      mode: 'live',
    };
  }

  // Fallback to clearly labelled demonstration fixtures if allowed and available for city
  if (useDemoFixtures) {
    const matchingFixtures = fixtures.snapshots.filter(
      (s) => s.city.toLowerCase() === city.toLowerCase()
    );
    if (matchingFixtures.length > 0) {
      for (const snap of matchingFixtures) {
        saveSnapshot(db, snap);
      }
      const importedForCity = importedForecasts.filter(
        (f) => f.city.toLowerCase() === city.toLowerCase()
      );
      const cityForecasts =
        importedForCity.length > 0
          ? importedForCity
          : fixtures.forecasts.filter((f) => f.city.toLowerCase() === city.toLowerCase());

      return {
        primarySnapshot: matchingFixtures[0],
        secondarySnapshots: matchingFixtures.slice(1),
        comparisonCities: {
          pune: puneFixtures,
          ahilyanagar: ahilyanagarFixtures,
        },
        forecasts: cityForecasts,
        providerStatuses: [cpcbRes.status, openaqRes.status, camsStatus],
        mode: 'demo_fixture',
      };
    }
  }

  // Honest unavailable state for custom/uncovered cities or when demo fixtures are toggled off
  const unavailable = buildUnavailableSnapshot(
    city,
    `No live environmental feed is configured and no verified station coverage is loaded for ${city}.`
  );

  return {
    primarySnapshot: unavailable,
    secondarySnapshots: [],
    comparisonCities: {
      pune: useDemoFixtures
        ? puneFixtures
        : [buildUnavailableSnapshot('Pune', 'Live providers unconfigured; fixtures disabled.')],
      ahilyanagar: useDemoFixtures
        ? ahilyanagarFixtures
        : [buildUnavailableSnapshot('Ahilyanagar', 'Live providers unconfigured; fixtures disabled.')],
    },
    forecasts: importedForecasts.filter((f) => f.city.toLowerCase() === city.toLowerCase()),
    providerStatuses: [cpcbRes.status, openaqRes.status, camsStatus],
    mode: 'unavailable',
  };
}

export async function getFullAppBootstrap(
  db: DatabaseSync,
  options: {
    cityOverride?: string;
    simulateOutage?: boolean;
    useDemoFixtures?: boolean;
    persistPlan?: boolean;
  } = {}
): Promise<{
  household: HouseholdProfile | null;
  members: ReturnType<typeof listMembers>;
  routines: ReturnType<typeof listRoutines>;
  locations: ReturnType<typeof listLocations>;
  settings: ReturnType<typeof getUserSettings>;
  environment: EnvironmentBundle;
  plan: ProtectionPlanResult | null;
  history: {
    plans: ProtectionPlanResult[];
    scenarios: ScenarioComparisonResult[];
    snapshots: EnvironmentalSnapshot[];
  };
}> {
  let household = getActiveHousehold(db);
  if (!household) {
    household = seedDemoHouseholdIfEmpty(db);
  }

  const members = listMembers(db, household.id);
  const routines = listRoutines(db, household.id);
  const locations = listLocations(db, household.id);
  const settings = getUserSettings(db, household.id);
  const targetCity = options.cityOverride?.trim() || settings.defaultCity || household.city;

  const environment = await resolveEnvironmentBundle(db, targetCity, {
    simulateOutage: options.simulateOutage ?? settings.simulateOutage,
    useDemoFixtures: options.useDemoFixtures ?? settings.useDemoFixtures,
  });

  const plan = generateProtectionPlan({
    household: { ...household, city: targetCity },
    members,
    routines,
    primarySnapshot: environment.primarySnapshot,
    secondarySnapshots: environment.secondarySnapshots,
    forecastSlots: environment.forecasts,
  });

  if (options.persistPlan) {
    savePlanHistory(db, household.id, plan, environment.primarySnapshot.id);
  }

  return {
    household,
    members,
    routines,
    locations,
    settings,
    environment,
    plan,
    history: {
      plans: listPlanHistory(db, household.id, 15),
      scenarios: listScenarioRuns(db, household.id, 15),
      snapshots: listSnapshots(db, 20),
    },
  };
}

export async function executeWhatIfScenario(
  db: DatabaseSync,
  modification: ScenarioModification,
  options: { simulateOutage?: boolean; useDemoFixtures?: boolean } = {}
): Promise<ScenarioComparisonResult> {
  const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
  const members = listMembers(db, household.id);
  const routines = listRoutines(db, household.id);
  const settings = getUserSettings(db, household.id);
  const env = await resolveEnvironmentBundle(db, household.city, {
    simulateOutage: options.simulateOutage ?? settings.simulateOutage,
    useDemoFixtures: options.useDemoFixtures ?? settings.useDemoFixtures,
  });

  const result = runWhatIfScenario(
    {
      household,
      members,
      routines,
      primarySnapshot: env.primarySnapshot,
      secondarySnapshots: env.secondarySnapshots,
      forecastSlots: env.forecasts,
    },
    modification
  );

  saveScenarioRun(db, household.id, result);
  return result;
}
