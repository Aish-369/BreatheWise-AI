import { Router } from 'express';
import { asyncHandler } from '../errors';
import { ExplainPlanBodySchema, generatePlanExplanation } from '../aiAdvisor';

export function createAiAdvisorRouter(): Router {
  const router = Router();

  router.post(
    '/ai/explain-plan',
    asyncHandler(async (req, res) => {
      const { lang, context } = ExplainPlanBodySchema.parse(req.body);
      const result = await generatePlanExplanation(context, lang);
      res.json(result);
    })
  );

  return router;
}
