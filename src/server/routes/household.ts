import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { HouseholdInputSchema, UserSettingsInputSchema } from '../../shared/types';
import { getHouseholdById, getUserSettings, updateHouseholdForId, upsertUserSettings } from '../db';
import { asyncHandler } from '../errors';
import { getRequestHousehold } from './session';

export function createHouseholdRouter(db: DatabaseSync): Router {
  const router = Router();

  router.put(
    '/household',
    asyncHandler((req, res) => {
      const parsed = HouseholdInputSchema.parse(req.body);
      const current = getRequestHousehold(req, db);
      const updated = updateHouseholdForId(db, current.id, parsed, false);
      res.json({ household: updated });
    })
  );

  router.get(
    '/settings',
    asyncHandler((req, res) => {
      const household = getRequestHousehold(req, db);
      res.json({ settings: getUserSettings(db, household.id) });
    })
  );

  router.put(
    '/settings',
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

  return router;
}
