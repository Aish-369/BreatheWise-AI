import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import {
  ActivityRoutineInputSchema,
  IdParamSchema,
  RoutineCompletionSchema,
} from '../../shared/types';
import {
  deleteRoutine,
  listRoutines,
  setRoutineCompletion,
  updateRoutine,
  upsertRoutine,
} from '../db';
import { assertFound, asyncHandler } from '../errors';
import { getRequestHousehold } from './session';

export function createRoutinesRouter(db: DatabaseSync): Router {
  const router = Router();

  router.post(
    '/routines',
    asyncHandler((req, res) => {
      const parsed = ActivityRoutineInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const routine = upsertRoutine(db, household.id, parsed);
      res.status(201).json({ routine, routines: listRoutines(db, household.id) });
    })
  );

  router.put(
    '/routines/:id',
    asyncHandler((req, res) => {
      const routineId = IdParamSchema.parse(req.params.id);
      const parsed = ActivityRoutineInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const routine = assertFound(
        updateRoutine(db, household.id, routineId, parsed),
        `Activity routine '${routineId}' not found.`
      );
      res.json({ routine, routines: listRoutines(db, household.id) });
    })
  );

  router.patch(
    '/routines/:id/completion',
    asyncHandler((req, res) => {
      const routineId = IdParamSchema.parse(req.params.id);
      const parsed = RoutineCompletionSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const routine = assertFound(
        setRoutineCompletion(db, household.id, routineId, parsed.completed),
        `Activity routine '${routineId}' not found.`
      );
      res.json({ routine, routines: listRoutines(db, household.id) });
    })
  );

  router.delete(
    '/routines/:id',
    asyncHandler((req, res) => {
      const routineId = IdParamSchema.parse(req.params.id);
      const household = getRequestHousehold(req, db);
      assertFound(
        deleteRoutine(db, household.id, routineId),
        `Activity routine '${routineId}' not found.`
      );
      res.json({ routines: listRoutines(db, household.id) });
    })
  );

  return router;
}
