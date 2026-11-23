import express from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  assertFound,
  asyncHandler,
  BadRequestError,
  ConflictError,
  errorMiddleware,
  NotFoundError,
  notFoundApiHandler,
} from '../src/server/errors';

const servers: http.Server[] = [];

async function startMiniApp(setup: (app: express.Express) => void): Promise<string> {
  const app = express();
  app.use(express.json());
  setup(app);
  app.use('/api', notFoundApiHandler);
  app.use(errorMiddleware);

  const server = await new Promise<http.Server>((resolve) => {
    const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
  });
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  while (servers.length > 0) {
    const srv = servers.pop()!;
    await new Promise<void>((resolve) => srv.close(() => resolve()));
  }
});

describe('server/errors middleware and assertFound', () => {
  it('returns the value from assertFound when truthy and throws NotFoundError for null/undefined/false', () => {
    expect(assertFound({ id: '1' }, 'Missing')).toEqual({ id: '1' });
    expect(() => assertFound(null, 'No record')).toThrow(NotFoundError);
    expect(() => assertFound(undefined, 'Missing item')).toThrow(NotFoundError);
    expect(() => assertFound(false, 'Deleted row')).toThrow(NotFoundError);
  });

  it('maps AppError subclasses, ZodError, malformed JSON, unknown routes, and generic Errors without leaking stack traces', async () => {
    const baseUrl = await startMiniApp((app) => {
      app.get(
        '/api/bad-request',
        asyncHandler(async () => {
          throw new BadRequestError('Invalid parameter', [{ path: 'city', message: 'Required' }]);
        })
      );
      app.get(
        '/api/conflict',
        asyncHandler(async () => {
          throw new ConflictError('Duplicate location');
        })
      );
      app.get(
        '/api/assert-missing',
        asyncHandler(async () => {
          assertFound(null, 'Household member not found.');
        })
      );
      app.post(
        '/api/zod-check',
        asyncHandler(async (req, res) => {
          const parsed = z.object({ name: z.string().min(2) }).parse(req.body);
          res.json(parsed);
        })
      );
      app.get(
        '/api/crash',
        asyncHandler(async () => {
          throw new Error('SECRET_INTERNAL_STACK_MARKER');
        })
      );
    });

    const badRes = await fetch(`${baseUrl}/api/bad-request`);
    expect(badRes.status).toBe(400);
    expect(await badRes.json()).toEqual({
      error: 'Invalid parameter',
      code: 'BAD_REQUEST',
      details: [{ path: 'city', message: 'Required' }],
    });

    const conflictRes = await fetch(`${baseUrl}/api/conflict`);
    expect(conflictRes.status).toBe(409);
    expect(await conflictRes.json()).toEqual({
      error: 'Duplicate location',
      code: 'CONFLICT',
    });

    const missingRes = await fetch(`${baseUrl}/api/assert-missing`);
    expect(missingRes.status).toBe(404);
    expect(await missingRes.json()).toEqual({
      error: 'Household member not found.',
      code: 'NOT_FOUND',
    });

    const zodRes = await fetch(`${baseUrl}/api/zod-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(zodRes.status).toBe(400);
    const zodBody = (await zodRes.json()) as {
      code: string;
      details: Array<{ path: string; message: string }>;
    };
    expect(zodBody.code).toBe('VALIDATION_ERROR');
    expect(zodBody.details[0].path).toBe('name');

    const jsonRes = await fetch(`${baseUrl}/api/zod-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":',
    });
    expect(jsonRes.status).toBe(400);
    expect(await jsonRes.json()).toEqual({
      error: 'Malformed JSON request body.',
      code: 'INVALID_JSON',
    });

    const notFoundRouteRes = await fetch(`${baseUrl}/api/does-not-exist`);
    expect(notFoundRouteRes.status).toBe(404);
    expect(await notFoundRouteRes.json()).toEqual({
      error: 'API endpoint not found: GET /does-not-exist',
      code: 'ROUTE_NOT_FOUND',
    });

    const crashRes = await fetch(`${baseUrl}/api/crash`);
    expect(crashRes.status).toBe(500);
    const crashText = await crashRes.text();
    expect(crashText).toContain('INTERNAL_ERROR');
    expect(crashText).not.toContain('SECRET_INTERNAL_STACK_MARKER');
    expect(crashText).not.toContain('at ');
  });
});
