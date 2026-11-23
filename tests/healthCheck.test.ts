import { afterEach, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/server/app';
import { getDb } from '../src/server/db';

describe('unauthenticated hosting health probe', () => {
  let server: Server | undefined;
  let db: ReturnType<typeof getDb> | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
      server = undefined;
    }
    db?.close();
    db = undefined;
  });

  it('returns a minimal database-ready response without creating a browser session', async () => {
    db = getDb(':memory:');
    const app = createApp(db);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server?.once('listening', resolve));

    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/healthz`);
    const payload = (await response.json()) as { status: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ status: 'ok' });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
