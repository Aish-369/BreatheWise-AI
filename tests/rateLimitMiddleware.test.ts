import express from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createRateLimitMiddleware } from '../src/server/rateLimit';

const servers: http.Server[] = [];

async function startRateLimitedApp(): Promise<string> {
  const app = express();
  app.set('trust proxy', true);
  app.use(
    '/api',
    createRateLimitMiddleware({
      windowMs: 60_000,
      max: 2,
      name: 'test-api',
    })
  );
  app.get('/api/resource', (_req, res) => res.status(200).json({ ok: true }));

  const server = await new Promise<http.Server>((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

afterEach(async () => {
  while (servers.length > 0) {
    const server = servers.pop()!;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

describe('rate-limit HTTP middleware', () => {
  it('sets standard rate-limit headers and blocks requests after the configured limit', async () => {
    const baseUrl = await startRateLimitedApp();
    const first = await fetch(`${baseUrl}/api/resource`, {
      headers: { 'x-forwarded-for': '198.51.100.10' },
    });
    const second = await fetch(`${baseUrl}/api/resource`, {
      headers: { 'x-forwarded-for': '198.51.100.10' },
    });
    const blocked = await fetch(`${baseUrl}/api/resource`, {
      headers: { 'x-forwarded-for': '198.51.100.10' },
    });

    expect(first.status).toBe(200);
    expect(first.headers.get('ratelimit-policy')).toBe('2;w=60');
    expect(first.headers.get('ratelimit-limit')).toBe('2');
    expect(first.headers.get('ratelimit-remaining')).toBe('1');

    expect(second.status).toBe(200);
    expect(second.headers.get('ratelimit-remaining')).toBe('0');

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('ratelimit-remaining')).toBe('0');
    expect(blocked.headers.get('retry-after')).toMatch(/^\d+$/);
    expect(await blocked.json()).toMatchObject({
      error: 'Too many requests. Please wait before trying again.',
      code: 'RATE_LIMITED',
      scope: 'test-api',
    });
  });

  it('keeps independent client buckets isolated', async () => {
    const baseUrl = await startRateLimitedApp();
    const clientA = { headers: { 'x-forwarded-for': '198.51.100.20' } };
    const clientB = { headers: { 'x-forwarded-for': '198.51.100.21' } };

    await fetch(`${baseUrl}/api/resource`, clientA);
    await fetch(`${baseUrl}/api/resource`, clientA);
    const blockedA = await fetch(`${baseUrl}/api/resource`, clientA);
    const allowedB = await fetch(`${baseUrl}/api/resource`, clientB);

    expect(blockedA.status).toBe(429);
    expect(allowedB.status).toBe(200);
    expect(allowedB.headers.get('ratelimit-remaining')).toBe('1');
  });
});
