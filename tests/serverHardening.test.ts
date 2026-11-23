import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  assertFound,
  errorMiddleware,
  notFoundApiHandler,
} from '../src/server/errors';
import { createRateLimitMiddleware, FixedWindowRateLimiter } from '../src/server/rateLimit';

let server: Server | undefined;

async function startServer(app: express.Express): Promise<string> {
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server?.once('listening', resolve);
    server?.once('error', reject);
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

describe('FixedWindowRateLimiter', () => {
  it('allows exactly the configured number of requests and reports remaining capacity', () => {
    const limiter = new FixedWindowRateLimiter(2, 10_000);

    expect(limiter.consume('client-a', 1_000)).toMatchObject({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
      resetAt: 11_000,
    });
    expect(limiter.consume('client-a', 2_000)).toMatchObject({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
      resetAt: 11_000,
    });
    expect(limiter.consume('client-a', 3_000)).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 8,
      resetAt: 11_000,
    });
  });

  it('resets an expired bucket and isolates different clients', () => {
    const limiter = new FixedWindowRateLimiter(1, 1_000);

    expect(limiter.consume(' client-a ', 5_000).allowed).toBe(true);
    expect(limiter.consume('client-a', 5_500).allowed).toBe(false);
    expect(limiter.consume('client-b', 5_500).allowed).toBe(true);
    expect(limiter.consume('client-a', 6_000)).toMatchObject({
      allowed: true,
      remaining: 0,
      resetAt: 7_000,
    });
  });

  it('normalizes blank keys and validates constructor configuration', () => {
    const limiter = new FixedWindowRateLimiter(1, 1_000);

    expect(limiter.consume('   ', 10).allowed).toBe(true);
    expect(limiter.consume('unknown', 20).allowed).toBe(false);
    expect(() => new FixedWindowRateLimiter(0, 1_000)).toThrow(
      'Rate limit max must be a positive integer.'
    );
    expect(() => new FixedWindowRateLimiter(1.5, 1_000)).toThrow(
      'Rate limit max must be a positive integer.'
    );
    expect(() => new FixedWindowRateLimiter(1, 999)).toThrow(
      'Rate limit window must be at least one second.'
    );
    expect(() => new FixedWindowRateLimiter(1, Number.POSITIVE_INFINITY)).toThrow(
      'Rate limit window must be at least one second.'
    );
  });

  it('returns standard rate-limit headers and a generic 429 response at the limit', async () => {
    const app = express();
    app.use(createRateLimitMiddleware({ windowMs: 60_000, max: 2, name: 'test-api' }));
    app.get('/resource', (_req, res) => res.json({ ok: true }));
    const baseUrl = await startServer(app);

    const first = await fetch(`${baseUrl}/resource`);
    const second = await fetch(`${baseUrl}/resource`);
    const third = await fetch(`${baseUrl}/resource`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.headers.get('ratelimit-limit')).toBe('2');
    expect(third.headers.get('ratelimit-remaining')).toBe('0');
    expect(third.headers.get('ratelimit-policy')).toBe('2;w=60');
    expect(Number(third.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect(await third.json()).toMatchObject({
      code: 'RATE_LIMITED',
      scope: 'test-api',
      error: 'Too many requests. Please wait before trying again.',
    });
  });
});

describe('API error handling', () => {
  it('preserves safe application error status, code, and optional details', async () => {
    const app = express();
    app.get('/bad-request', (_req, _res, next) =>
      next(new BadRequestError('Invalid input.', [{ path: 'name', message: 'Required.' }]))
    );
    app.get('/not-found', (_req, _res, next) => next(new NotFoundError('Record not found.')));
    app.get('/conflict', (_req, _res, next) => next(new ConflictError('Already exists.')));
    app.use(errorMiddleware);
    const baseUrl = await startServer(app);

    const badRequest = await fetch(`${baseUrl}/bad-request`);
    expect(badRequest.status).toBe(400);
    expect(await badRequest.json()).toEqual({
      error: 'Invalid input.',
      code: 'BAD_REQUEST',
      details: [{ path: 'name', message: 'Required.' }],
    });

    const notFound = await fetch(`${baseUrl}/not-found`);
    expect(notFound.status).toBe(404);
    expect(await notFound.json()).toEqual({ error: 'Record not found.', code: 'NOT_FOUND' });

    const conflict = await fetch(`${baseUrl}/conflict`);
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ error: 'Already exists.', code: 'CONFLICT' });
  });

  it('converts Zod validation errors into structured field details', async () => {
    const app = express();
    app.get('/validate', (_req, _res, next) => {
      const result = z.object({ age: z.number().int().positive() }).safeParse({ age: -1 });
      if (!result.success) next(result.error);
    });
    app.use(errorMiddleware);
    const baseUrl = await startServer(app);

    const response = await fetch(`${baseUrl}/validate`);
    const payload = (await response.json()) as {
      code: string;
      details: Array<{ path: string; message: string }>;
    };

    expect(response.status).toBe(400);
    expect(payload.code).toBe('VALIDATION_ERROR');
    expect(payload.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'age' })])
    );
  });

  it('returns a safe 400 for malformed JSON without leaking parser internals', async () => {
    const app = express();
    app.use(express.json());
    app.post('/payload', (_req, res) => res.json({ ok: true }));
    app.use(errorMiddleware);
    const baseUrl = await startServer(app);

    const response = await fetch(`${baseUrl}/payload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"broken":',
    });
    const payload = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: 'Malformed JSON request body.',
      code: 'INVALID_JSON',
    });
    expect(JSON.stringify(payload)).not.toMatch(/stack|SyntaxError|body-parser/i);
  });

  it('hides unexpected internal error details from API clients', async () => {
    const app = express();
    app.get('/crash', (_req, _res, next) =>
      next(new Error('database password must never be exposed'))
    );
    app.use(errorMiddleware);
    const baseUrl = await startServer(app);

    const response = await fetch(`${baseUrl}/crash`);
    const payload = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: 'Internal server error. Please try again.',
      code: 'INTERNAL_ERROR',
    });
    expect(JSON.stringify(payload)).not.toContain('database password');
  });

  it('returns a structured 404 for unknown API routes', async () => {
    const app = express();
    app.use('/api', notFoundApiHandler);
    const baseUrl = await startServer(app);

    const response = await fetch(`${baseUrl}/api/missing`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'API endpoint not found: GET /api/missing',
      code: 'ROUTE_NOT_FOUND',
    });
  });

  it('assertFound rejects null, undefined, and false but preserves valid falsy values', () => {
    expect(assertFound(0, 'Missing')).toBe(0);
    expect(assertFound('', 'Missing')).toBe('');
    expect(assertFound([], 'Missing')).toEqual([]);
    expect(() => assertFound(null, 'Missing')).toThrow(NotFoundError);
    expect(() => assertFound(undefined, 'Missing')).toThrow(NotFoundError);
    expect(() => assertFound(false, 'Missing')).toThrow(NotFoundError);
    expect(new AppError(418, 'TEAPOT', 'No coffee')).toMatchObject({
      statusCode: 418,
      code: 'TEAPOT',
    });
  });
});
