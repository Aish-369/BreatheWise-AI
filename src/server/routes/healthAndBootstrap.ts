import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { z } from 'zod';
import {
  getSchemaVersion,
  listDataProvidersWithLicenses,
  listPlanHistory,
  listScenarioRuns,
  listSnapshots,
} from '../db';
import { asyncHandler } from '../errors';
import { getFullAppBootstrap } from '../service';
import { getRequestHousehold, getSessionHouseholdId } from './session';

const BootstrapQuerySchema = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  simulateOutage: z.enum(['true', 'false']).optional(),
  useFixtures: z.enum(['true', 'false']).optional(),
  persist: z.enum(['true', 'false']).optional(),
});

export function createHealthAndBootstrapRouter(db: DatabaseSync): Router {
  const router = Router();

  router.get(
    '/health',
    asyncHandler((_req, res) => {
      res.json({
        ok: true,
        service: 'BreatheWise AI',
        schemaVersion: getSchemaVersion(db),
        timestamp: new Date().toISOString(),
      });
    })
  );

  router.get(
    '/bootstrap',
    asyncHandler(async (req, res) => {
      const query = BootstrapQuerySchema.parse(req.query);
      const cityOverride = query.city;
      const simulateOutage =
        query.simulateOutage !== undefined ? query.simulateOutage === 'true' : undefined;
      const useDemoFixtures =
        query.useFixtures !== undefined ? query.useFixtures !== 'false' : undefined;
      const persistPlan = query.persist === 'true';

      const data = await getFullAppBootstrap(db, {
        householdId: getSessionHouseholdId(req),
        cityOverride,
        simulateOutage,
        useDemoFixtures,
        persistPlan,
      });
      res.json(data);
    })
  );

  router.get(
    '/providers',
    asyncHandler((_req, res) => {
      res.json({ providers: listDataProvidersWithLicenses(db) });
    })
  );

  router.get(
    '/history',
    asyncHandler((req, res) => {
      const household = getRequestHousehold(req, db);
      res.json({
        plans: listPlanHistory(db, household.id, 20),
        scenarios: listScenarioRuns(db, household.id, 20),
        snapshots: listSnapshots(db, 30),
      });
    })
  );

  return router;
}
