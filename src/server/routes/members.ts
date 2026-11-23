import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { FamilyMemberInputSchema, IdParamSchema } from '../../shared/types';
import { addMember, deleteMember, listMembers, listRoutines, updateMember } from '../db';
import { assertFound, asyncHandler } from '../errors';
import { getRequestHousehold } from './session';

export function createMembersRouter(db: DatabaseSync): Router {
  const router = Router();

  router.post(
    '/members',
    asyncHandler((req, res) => {
      const parsed = FamilyMemberInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const member = addMember(db, household.id, parsed);
      res.status(201).json({ member, members: listMembers(db, household.id) });
    })
  );

  router.put(
    '/members/:id',
    asyncHandler((req, res) => {
      const memberId = IdParamSchema.parse(req.params.id);
      const parsed = FamilyMemberInputSchema.parse(req.body);
      const household = getRequestHousehold(req, db);
      const member = assertFound(
        updateMember(db, household.id, memberId, parsed),
        `Family member '${memberId}' not found.`
      );
      res.json({ member, members: listMembers(db, household.id) });
    })
  );

  router.delete(
    '/members/:id',
    asyncHandler((req, res) => {
      const memberId = IdParamSchema.parse(req.params.id);
      const household = getRequestHousehold(req, db);
      assertFound(
        deleteMember(db, household.id, memberId),
        `Family member '${memberId}' not found.`
      );
      res.json({
        members: listMembers(db, household.id),
        routines: listRoutines(db, household.id),
      });
    })
  );

  return router;
}
