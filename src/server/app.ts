import express from 'express';
import crypto from 'node:crypto';
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
  createBrowserSession,
  createHouseholdForBrowserSession,
  getActiveHousehold,
  getBrowserSession,
  getHouseholdById,
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
  revokeBrowserSession,
  saveForecastSlots,
  seedDemoHouseholdIfEmpty,
  setRoutineCompletion,
  updateLocation,
  updateMember,
  updateRoutine,
  updateHouseholdForId,
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

const sessionHouseholdByRequest = new WeakMap<express.Request, string>();

function getRequestHousehold(req: express.Request, db: DatabaseSync) {
  const id = sessionHouseholdByRequest.get(req);
  const household = id ? getHouseholdById(db, id) : getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
  if (!household) throw new NotFoundError('Household not found for this browser session.');
  return household;
}

export interface CreateAppOptions {
  mountErrorHandler?: boolean;
}

export function createApp(db: DatabaseSync, options: CreateAppOptions = {}): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
      );
    }
    if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/session', (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      res.json({ authenticated: true, household });
      return;
    }
    const cookie = (req.headers.cookie ?? '').split(';').map((part) => part.trim())
      .find((part) => part.startsWith('breathewise_session='));
    const tokenFromCookie = cookie?.slice('breathewise_session='.length);
    const existing = tokenFromCookie ? getBrowserSession(db, tokenFromCookie) : null;
    const existingHousehold = existing ? getHouseholdById(db, existing.householdId) : null;
    if (existing && existingHousehold && !existingHousehold.isDemoProfile) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({ authenticated: true, household: existingHousehold });
      return;
    }
    // Rotate legacy demo-profile sessions into a clean, empty household.
    if (tokenFromCookie && existing) revokeBrowserSession(db, tokenFromCookie);
    const token = crypto.randomBytes(32).toString('base64url');
    const household = createHouseholdForBrowserSession(db);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    createBrowserSession(db, token, household.id, expiresAt);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `breathewise_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ authenticated: true, household });
  });

  app.use('/api', (req, res, next) => {
    if (['/health', '/providers', '/session', '/local/reset-demo', '/local/clear'].includes(req.path)) {
      next();
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      next();
      return;
    }
    const cookie = (req.headers.cookie ?? '').split(';').map((part) => part.trim())
      .find((part) => part.startsWith('breathewise_session='));
    const token = cookie?.slice('breathewise_session='.length);
    const session = token ? getBrowserSession(db, token) : null;
    if (!session || !getHouseholdById(db, session.householdId)) {
      res.status(401).json({ error: 'A valid browser session is required.', code: 'SESSION_REQUIRED' });
      return;
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      let validOrigin = false;
      try {
        const parsed = origin ? new URL(origin) : null;
        validOrigin = Boolean(parsed && parsed.host === req.get('host') && parsed.protocol === 'https:');
      } catch { validOrigin = false; }
      if (!validOrigin) {
        res.status(403).json({ error: 'Cross-origin request rejected.', code: 'CSRF_ORIGIN_REJECTED' });
        return;
      }
    }
    sessionHouseholdByRequest.set(req, session.householdId);
    next();
  });

  app.get(
    '/api/health',
    asyncHandler((req, res) => {
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
        process.env.NODE_ENV === 'production'
          ? false
          : req.query.useFixtures !== undefined ? req.query.useFixtures !== 'false' : undefined;
      const persistPlan = req.query.persist === 'true';

      const data = await getFullAppBootstrap(db, {
        householdId: sessionHouseholdByRequest.get(req),
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
      const current = getRequestHousehold(req, db);
      if (!current) throw new NotFoundError('Household not found.');
      const updated = updateHouseholdForId(db, current.id, parsed, false);
      res.json({ household: updated });
    })
  );

  app.post(
    '/api/members',
    asyncHandler((req, res) => {
      const parsed = FamilyMemberInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const member = addMember(db, household.id, parsed);
      res.status(201).json({ member, members: listMembers(db, household.id) });
    })
  );

  app.put(
    '/api/members/:id',
    asyncHandler((req, res) => {
      const memberId = IdParamSchema.parse(req.params.id);
      const parsed = FamilyMemberInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
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
      const household = getRequestHousehold(req, db);
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
      const household = getRequestHousehold(req, db);
      const routine = upsertRoutine(db, household.id, parsed);
      res.status(201).json({ routine, routines: listRoutines(db, household.id) });
    })
  );

  app.put(
    '/api/routines/:id',
    asyncHandler((req, res) => {
      const routineId = IdParamSchema.parse(req.params.id);
      const parsed = ActivityRoutineInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
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
      const household = getRequestHousehold(req, db);
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
      const household = getRequestHousehold(req, db);
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
    asyncHandler((req, res) => {
      const household = getRequestHousehold(req, db);
      res.json({ locations: listLocations(db, household.id) });
    })
  );

  app.post(
    '/api/locations',
    asyncHandler((req, res) => {
      const parsed = LocationInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
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
      const household = getRequestHousehold(req, db);
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
      const household = getRequestHousehold(req, db);
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
    asyncHandler((req, res) => {
      const household = getRequestHousehold(req, db);
      res.json({ settings: getUserSettings(db, household.id) });
    })
  );

  app.put(
    '/api/settings',
    asyncHandler((req, res) => {
      const parsed = UserSettingsInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const settings = upsertUserSettings(db, household.id, {
        ...parsed,
        useDemoFixtures: process.env.NODE_ENV === 'production' ? false : parsed.useDemoFixtures,
      });
      res.json({
        settings,
        household: getHouseholdById(db, household.id),
      });
    })
  );

  app.get(
    '/api/providers',
    asyncHandler((req, res) => {
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
      const household = getRequestHousehold(req, db);
      saveForecastSlots(db, parsed.city, parsed.slots, household.id);
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
        process.env.NODE_ENV === 'production'
          ? false
          : typeof req.body?.useFixtures === 'boolean' ? req.body.useFixtures : undefined;

      const household = getRequestHousehold(req, db);
      if (!household) throw new NotFoundError('Household not found.');
      const result = await executeWhatIfScenario(db, parsed, {
        householdId: household.id,
        simulateOutage,
        useDemoFixtures,
      });
      res.status(201).json(result);
    })
  );

  app.get(
    '/api/history',
    asyncHandler((req, res) => {
      const household = getRequestHousehold(req, db);
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
    asyncHandler((req, res) => {
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
