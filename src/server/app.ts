import express from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { errorMiddleware, notFoundApiHandler } from './errors';
import { createRateLimitMiddleware } from './rateLimit';
import { createAiAdvisorRouter } from './routes/aiAdvisor';
import { createEnvironmentRouter } from './routes/environment';
import { createHealthAndBootstrapRouter } from './routes/healthAndBootstrap';
import { createHouseholdRouter } from './routes/household';
import { createLocalMaintenanceRouter } from './routes/local';
import { createLocationsRouter } from './routes/locations';
import { createMembersRouter } from './routes/members';
import { createRoutinesRouter } from './routes/routines';
import { handleGetSession, requireSessionMiddleware } from './routes/session';

export interface CreateAppOptions {
  mountErrorHandler?: boolean;
}

function applySecurityHeaders(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
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
}

export function createApp(db: DatabaseSync, options: CreateAppOptions = {}): express.Express {
  const app = express();
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(applySecurityHeaders);
  app.use(express.json({ limit: '1mb' }));

  // Hosting-provider liveness/readiness probe: no session cookie or household data required.
  // Keep the response intentionally minimal; database failures return only a generic status.
  app.get('/healthz', (_req, res) => {
    try {
      db.prepare('SELECT 1').get();
      res.status(200).json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.use(
    '/api/session',
    createRateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20, name: 'session' })
  );
  app.use(
    '/api/ai',
    createRateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 8, name: 'ai-advisor' })
  );
  app.use('/api', createRateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 240, name: 'api' }));

  app.get('/api/session', handleGetSession(db));
  app.use('/api', requireSessionMiddleware(db));

  app.use('/api', createHealthAndBootstrapRouter(db));
  app.use('/api', createHouseholdRouter(db));
  app.use('/api', createMembersRouter(db));
  app.use('/api', createRoutinesRouter(db));
  app.use('/api', createLocationsRouter(db));
  app.use('/api', createEnvironmentRouter(db));
  app.use('/api', createAiAdvisorRouter());
  app.use('/api', createLocalMaintenanceRouter(db));

  app.use('/api', notFoundApiHandler);

  if (options.mountErrorHandler !== false) {
    app.use(errorMiddleware);
  }

  return app;
}
