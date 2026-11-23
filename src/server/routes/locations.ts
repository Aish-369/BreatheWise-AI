import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { IdParamSchema, LocationInputSchema } from '../../shared/types';
import { createLocation, deleteLocation, listLocations, updateLocation } from '../db';
import { assertFound, asyncHandler } from '../errors';
import { getRequestHousehold } from './session';

export function createLocationsRouter(db: DatabaseSync): Router {
  const router = Router();

  router.get(
    '/locations',
    asyncHandler((req, res) => {
      const household = getRequestHousehold(req, db);
      res.json({ locations: listLocations(db, household.id) });
    })
  );

  router.post(
    '/locations',
    asyncHandler((req, res) => {
      const parsed = LocationInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const location = createLocation(db, household.id, parsed);
      res.status(201).json({ location, locations: listLocations(db, household.id) });
    })
  );

  router.put(
    '/locations/:id',
    asyncHandler((req, res) => {
      const locationId = IdParamSchema.parse(req.params.id);
      const parsed = LocationInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const location = assertFound(
        updateLocation(db, household.id, locationId, parsed),
        `Location '${locationId}' not found.`
      );
      res.json({ location, locations: listLocations(db, household.id) });
    })
  );

  router.delete(
    '/locations/:id',
    asyncHandler((req, res) => {
      const locationId = IdParamSchema.parse(req.params.id);
      const household = getRequestHousehold(req, db);
      assertFound(
        deleteLocation(db, household.id, locationId),
        `Location '${locationId}' not found.`
      );
      res.json({ locations: listLocations(db, household.id) });
    })
  );

  return router;
}
