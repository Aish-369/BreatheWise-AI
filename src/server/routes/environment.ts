import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import { z } from 'zod';
import { ScenarioModificationSchema } from '../../shared/types';
import { parseCamsImport } from '../adapters/camsImporter';
import { saveForecastSlots } from '../db';
import { asyncHandler, BadRequestError } from '../errors';
import { executeWhatIfScenario } from '../service';
import { getRequestHousehold } from './session';

const CamsImportBodySchema = z.object({
  rawText: z
    .string({ error: 'CAMS import text must be a string.' })
    .trim()
    .min(1, 'Import payload is empty.')
    .max(256_000, 'Import payload exceeds 256 KB limit.'),
});

const ScenarioEnvelopeSchema = z.object({
  modification: ScenarioModificationSchema,
  simulateOutage: z.boolean().optional(),
  useFixtures: z.boolean().optional(),
});

export function createEnvironmentRouter(db: DatabaseSync): Router {
  const router = Router();

  router.post(
    '/environment/import-cams',
    asyncHandler((req, res) => {
      const { rawText } = CamsImportBodySchema.parse(req.body);
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

  router.post(
    '/scenarios/run',
    asyncHandler(async (req, res) => {
      const hasModificationEnvelope =
        req.body !== null && typeof req.body === 'object' && 'modification' in req.body;
      const envelope = hasModificationEnvelope
        ? ScenarioEnvelopeSchema.parse(req.body)
        : { modification: ScenarioModificationSchema.parse(req.body) };

      const useDemoFixtures = process.env.NODE_ENV === 'production' ? false : envelope.useFixtures;

      const household = getRequestHousehold(req, db);
      const result = await executeWhatIfScenario(db, envelope.modification, {
        householdId: household.id,
        simulateOutage: envelope.simulateOutage,
        useDemoFixtures,
      });
      res.status(201).json(result);
    })
  );

  return router;
}
