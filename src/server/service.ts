import type { DatabaseSync } from 'node:sqlite';
import { generateProtectionPlan, runWhatIfScenario } from '../engine/intelligence';
import type {
  EnvironmentalSnapshot,
  HouseholdProfile,
  ProtectionPlanResult,
  ScenarioComparisonResult,
  ScenarioModification,
} from '../shared/types';
import { clearCpcbCache } from './adapters/cpcb';
import { clearOpenAqCache } from './adapters/openaq';
import {
  getActiveHousehold,
  getHouseholdById,
  getUserSettings,
  listCitySnapshots,
  listLocations,
  listMembers,
  listPlanHistory,
  listRoutines,
  listScenarioRuns,
  listSnapshots,
  savePlanHistory,
  saveScenarioRun,
  seedDemoHouseholdIfEmpty,
} from './db';
import { type EnvironmentBundle, resolveEnvironmentBundle } from './serviceEnvironment';

export { type EnvironmentBundle, resolveEnvironmentBundle };

export function clearAdapterCaches(): void {
  clearOpenAqCache();
  clearCpcbCache();
}

export async function getFullAppBootstrap(
  db: DatabaseSync,
  options: {
    householdId?: string;
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
  const household = options.householdId
    ? getHouseholdById(db, options.householdId)
    : (getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db));
  if (!household) throw new Error('Household not found for this browser session.');

  const members = listMembers(db, household.id);
  const routines = listRoutines(db, household.id);
  const locations = listLocations(db, household.id);
  const settings = getUserSettings(db, household.id);
  const targetCity = options.cityOverride?.trim() || settings.defaultCity || household.city;

  const environment = await resolveEnvironmentBundle(db, targetCity, {
    householdId: household.id,
    simulateOutage: options.simulateOutage ?? settings.simulateOutage,
    useDemoFixtures: options.useDemoFixtures ?? settings.useDemoFixtures,
    extraCities: locations.map((l) => l.city),
  });

  const historicalSnapshots = listCitySnapshots(db, targetCity, 15);
  const plan = generateProtectionPlan({
    household: { ...household, city: targetCity },
    members,
    routines,
    primarySnapshot: environment.primarySnapshot,
    secondarySnapshots: environment.secondarySnapshots,
    historicalSnapshots,
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
  options: { householdId?: string; simulateOutage?: boolean; useDemoFixtures?: boolean } = {}
): Promise<ScenarioComparisonResult> {
  const household = options.householdId
    ? getHouseholdById(db, options.householdId)
    : (getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db));
  if (!household) throw new Error('Household not found for this browser session.');
  const members = listMembers(db, household.id);
  const routines = listRoutines(db, household.id);
  const settings = getUserSettings(db, household.id);
  const env = await resolveEnvironmentBundle(db, household.city, {
    householdId: household.id,
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
