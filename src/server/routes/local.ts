import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { clearAllLocalData, resetToDemoProfile } from '../db';
import { AppError, asyncHandler } from '../errors';
import { getFullAppBootstrap } from '../service';

export function createLocalMaintenanceRouter(db: DatabaseSync): Router {
  const router = Router();

  router.post(
    '/local/reset-demo',
    asyncHandler(async (_req, res) => {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(
          403,
          'LOCAL_MAINTENANCE_DISABLED',
          'Local demo reset is disabled in production.'
        );
      }
      resetToDemoProfile(db);
      const data = await getFullAppBootstrap(db, { persistPlan: true });
      res.json(data);
    })
  );

  router.delete(
    '/local/clear',
    asyncHandler((_req, res) => {
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(
          403,
          'LOCAL_MAINTENANCE_DISABLED',
          'Local data clearing is disabled in production.'
        );
      }
      clearAllLocalData(db);
      res.json({ ok: true, cleared: true });
    })
  );

  return router;
}
