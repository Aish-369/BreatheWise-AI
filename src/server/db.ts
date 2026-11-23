export { closeDb, getDb, getSchemaVersion } from './db/connection';
export {
  clearAllLocalData,
  createDemoHousehold,
  createHouseholdForBrowserSession,
  getActiveHousehold,
  getHouseholdById,
  resetToDemoProfile,
  seedDemoHouseholdIfEmpty,
  updateHouseholdForId,
  upsertHousehold,
} from './db/households';
export { createLocation, deleteLocation, listLocations, updateLocation } from './db/locations';
export { addMember, deleteMember, listMembers, updateMember } from './db/members';
export {
  listPlanEvidence,
  listPlanHistory,
  listPlanRecommendations,
  listScenarioRuns,
  savePlanHistory,
  saveScenarioRun,
} from './db/plans';
export {
  deleteRoutine,
  listRoutines,
  setRoutineCompletion,
  updateRoutine,
  upsertRoutine,
} from './db/routines';
export {
  type BrowserSessionRecord,
  createBrowserSession,
  getBrowserSession,
  hashSessionToken,
  revokeBrowserSession,
} from './db/sessions';
export { getUserSettings, listDataProvidersWithLicenses, upsertUserSettings } from './db/settings';
export {
  listCitySnapshots,
  listImportedForecasts,
  listSnapshots,
  saveForecastSlots,
  saveSnapshot,
} from './db/snapshots';
