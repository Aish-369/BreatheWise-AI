import express from 'express';
import type { DatabaseSync } from 'node:sqlite';
import {
  ActivityRoutineInputSchema,
  FamilyMemberInputSchema,
  HouseholdInputSchema,
  IdParamSchema,
  LocationInputSchema,
  RoutineCompletionSchema,
  ScenarioModificationSchema,
  UserSettingsInputSchema,
} from '../shared/types';
import { parseCamsImport } from './adapters/camsImporter';
import {
  addMember,
  clearAllLocalData,
  createLocation,
  deleteLocation,
  deleteMember,
  deleteRoutine,
  getActiveHousehold,
  getSchemaVersion,
  getUserSettings,
  listDataProvidersWithLicenses,
  listLocations,
  listMembers,
  listPlanHistory,
  listRoutines,
  listScenarioRuns,
  listSnapshots,
  resetToDemoProfile,
  saveForecastSlots,
  seedDemoHouseholdIfEmpty,
  setRoutineCompletion,
  updateLocation,
  updateMember,
  updateRoutine,
  upsertHousehold,
  upsertRoutine,
  upsertUserSettings,
} from './db';
import {
  asyncHandler,
  AppError,
  BadRequestError,
  errorMiddleware,
  notFoundApiHandler,
  NotFoundError,
} from './errors';
import { executeWhatIfScenario, getFullAppBootstrap } from './service';

export interface CreateAppOptions {
  mountErrorHandler?: boolean;
}

export function createApp(db: DatabaseSync, options: CreateAppOptions = {}): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  app.get(
    '/api/health',
    asyncHandler((_req, res) => {
      res.json({
        ok: true,
        service: 'BreatheWise AI',
        schemaVersion: getSchemaVersion(db),
        timestamp: new Date().toISOString(),
      });
    })
  );

  app.get(
    '/api/bootstrap',
    asyncHandler(async (req, res) => {
      const cityOverride = typeof req.query.city === 'string' ? req.query.city : undefined;
      const simulateOutage =
        req.query.simulateOutage !== undefined ? req.query.simulateOutage === 'true' : undefined;
      const useDemoFixtures =
        req.query.useFixtures !== undefined ? req.query.useFixtures !== 'false' : undefined;
      const persistPlan = req.query.persist === 'true';

      const data = await getFullAppBootstrap(db, {
        cityOverride,
        simulateOutage,
        useDemoFixtures,
        persistPlan,
      });
      res.json(data);
    })
  );

  app.put(
    '/api/household',
    asyncHandler((req, res) => {
      const parsed = HouseholdInputSchema.parse(req.body);
      const updated = upsertHousehold(db, parsed, false);
      res.json({ household: updated });
    })
  );

  app.post(
    '/api/members',
    asyncHandler((req, res) => {
      const parsed = FamilyMemberInputSchema.parse(req.body);
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      const member = addMember(db, household.id, parsed);
      res.status(201).json({ member, members: listMembers(db, household.id) });
    })
  );

  app.put(
    '/api/members/:id',
    asyncHandler((req, res) => {
      const memberId = IdParamSchema.parse(req.params.id);
      const parsed = FamilyMemberInputSchema.parse(req.body);
      const household = getActiveHousehold(db);
      if (!household) {
        throw new NotFoundError('Household not found.');
      }
      const member = updateMember(db, household.id, memberId, parsed);
      if (!member) {
        throw new NotFoundError(`Family member '${memberId}' not found.`);
      }
      res.json({ member, members: listMembers(db, household.id) });
    })
  );

  app.delete(
    '/api/members/:id',
    asyncHandler((req, res) => {
      const memberId = IdParamSchema.parse(req.params.id);
      const household = getActiveHousehold(db);
      if (!household) {
        throw new NotFoundError('Household not found.');
      }
      const deleted = deleteMember(db, household.id, memberId);
      if (!deleted) {
        throw new NotFoundError(`Family member '${memberId}' not found.`);
      }
      res.json({
        members: listMembers(db, household.id),
        routines: listRoutines(db, household.id),
      });
    })
  );

  app.post(
    '/api/routines',
    asyncHandler((req, res) => {
      const parsed = ActivityRoutineInputSchema.parse(req.body);
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      const routine = upsertRoutine(db, household.id, parsed);
      res.status(201).json({ routine, routines: listRoutines(db, household.id) });
    })
  );

  app.put(
    '/api/routines/:id',
    asyncHandler((req, res) => {
      const routineId = IdParamSchema.parse(req.params.id);
      const parsed = ActivityRoutineInputSchema.parse(req.body);
      const household = getActiveHousehold(db);
      if (!household) {
        throw new NotFoundError('Household not found.');
      }
      const routine = updateRoutine(db, household.id, routineId, parsed);
      if (!routine) {
        throw new NotFoundError(`Activity routine '${routineId}' not found.`);
      }
      res.json({ routine, routines: listRoutines(db, household.id) });
    })
  );

  app.patch(
    '/api/routines/:id/completion',
    asyncHandler((req, res) => {
      const routineId = IdParamSchema.parse(req.params.id);
      const parsed = RoutineCompletionSchema.parse(req.body);
      const household = getActiveHousehold(db);
      if (!household) {
        throw new NotFoundError('Household not found.');
      }
      const routine = setRoutineCompletion(db, household.id, routineId, parsed.completed);
      if (!routine) {
        throw new NotFoundError(`Activity routine '${routineId}' not found.`);
      }
      res.json({ routine, routines: listRoutines(db, household.id) });
    })
  );

  app.delete(
    '/api/routines/:id',
    asyncHandler((req, res) => {
      const routineId = IdParamSchema.parse(req.params.id);
      const household = getActiveHousehold(db);
      if (!household) {
        throw new NotFoundError('Household not found.');
      }
      const deleted = deleteRoutine(db, household.id, routineId);
      if (!deleted) {
        throw new NotFoundError(`Activity routine '${routineId}' not found.`);
      }
      res.json({ routines: listRoutines(db, household.id) });
    })
  );

  app.get(
    '/api/locations',
    asyncHandler((_req, res) => {
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      res.json({ locations: listLocations(db, household.id) });
    })
  );

  app.post(
    '/api/locations',
    asyncHandler((req, res) => {
      const parsed = LocationInputSchema.parse(req.body);
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      const location = createLocation(db, household.id, parsed);
      res.status(201).json({
        location,
        locations: listLocations(db, household.id),
      });
    })
  );

  app.put(
    '/api/locations/:id',
    asyncHandler((req, res) => {
      const locationId = IdParamSchema.parse(req.params.id);
      const parsed = LocationInputSchema.parse(req.body);
      const household = getActiveHousehold(db);
      if (!household) {
        throw new NotFoundError('Household not found.');
      }
      const location = updateLocation(db, household.id, locationId, parsed);
      if (!location) {
        throw new NotFoundError(`Location '${locationId}' not found.`);
      }
      res.json({
        location,
        locations: listLocations(db, household.id),
      });
    })
  );

  app.delete(
    '/api/locations/:id',
    asyncHandler((req, res) => {
      const locationId = IdParamSchema.parse(req.params.id);
      const household = getActiveHousehold(db);
      if (!household) {
        throw new NotFoundError('Household not found.');
      }
      const deleted = deleteLocation(db, household.id, locationId);
      if (!deleted) {
        throw new NotFoundError(`Location '${locationId}' not found.`);
      }
      res.json({
        locations: listLocations(db, household.id),
      });
    })
  );

  app.get(
    '/api/settings',
    asyncHandler((_req, res) => {
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      res.json({ settings: getUserSettings(db, household.id) });
    })
  );

  app.put(
    '/api/settings',
    asyncHandler((req, res) => {
      const parsed = UserSettingsInputSchema.parse(req.body);
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      const settings = upsertUserSettings(db, household.id, parsed);
      res.json({
        settings,
        household: getActiveHousehold(db),
      });
    })
  );

  app.get(
    '/api/providers',
    asyncHandler((_req, res) => {
      res.json({
        providers: listDataProvidersWithLicenses(db),
      });
    })
  );

  app.post(
    '/api/environment/import-cams',
    asyncHandler((req, res) => {
      const rawText = typeof req.body?.rawText === 'string' ? req.body.rawText : '';
      const parsed = parseCamsImport(rawText);
      if (!parsed.ok || !parsed.slots || !parsed.city) {
        throw new BadRequestError(parsed.error ?? 'Invalid CAMS forecast payload.');
      }
      saveForecastSlots(db, parsed.city, parsed.slots);
      res.status(201).json({
        importedCount: parsed.slots.length,
        city: parsed.city,
        slots: parsed.slots,
      });
    })
  );

  app.post(
    '/api/scenarios/run',
    asyncHandler(async (req, res) => {
      const parsed = ScenarioModificationSchema.parse(req.body?.modification ?? req.body);
      const simulateOutage =
        typeof req.body?.simulateOutage === 'boolean' ? req.body.simulateOutage : undefined;
      const useDemoFixtures =
        typeof req.body?.useFixtures === 'boolean' ? req.body.useFixtures : undefined;

      const result = await executeWhatIfScenario(db, parsed, {
        simulateOutage,
        useDemoFixtures,
      });
      res.status(201).json(result);
    })
  );

  app.get(
    '/api/history',
    asyncHandler((_req, res) => {
      const household = getActiveHousehold(db);
      if (!household) {
        res.json({ plans: [], scenarios: [], snapshots: [] });
        return;
      }
      res.json({
        plans: listPlanHistory(db, household.id, 20),
        scenarios: listScenarioRuns(db, household.id, 20),
        snapshots: listSnapshots(db, 30),
      });
    })
  );

  app.post(
    '/api/local/reset-demo',
    asyncHandler(async (_req, res) => {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(403, 'LOCAL_MAINTENANCE_DISABLED', 'Local demo reset is disabled in production.');
      }
      resetToDemoProfile(db);
      const data = await getFullAppBootstrap(db, { persistPlan: true });
      res.json(data);
    })
  );

  app.delete(
    '/api/local/clear',
    asyncHandler((_req, res) => {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(403, 'LOCAL_MAINTENANCE_DISABLED', 'Local data clearing is disabled in production.');
      }
      clearAllLocalData(db);
      res.json({ ok: true, cleared: true });
    })
  );

  app.use('/api', notFoundApiHandler);

  if (options.mountErrorHandler !== false) {
    app.use(errorMiddleware);
  }

  return app;
}
