import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import type { Request, Response } from 'express';
import { afterEach, describe, expect, it } from 'vitest';
import { createBrowserSession, createHouseholdForBrowserSession, getDb } from '../src/server/db';
import {
  extractSessionToken,
  getRequestHousehold,
  getSessionHouseholdId,
  handleGetSession,
  requireSessionMiddleware,
} from '../src/server/routes/session';

const tempDirs: string[] = [];
const openDbs: DatabaseSync[] = [];

function createTestDb(): DatabaseSync {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'breathewise-session-'));
  tempDirs.push(dir);
  const db = getDb(path.join(dir, 'test.db'));
  openDbs.push(db);
  return db;
}

function makeMockRequest(opts: {
  cookie?: string;
  method?: string;
  path?: string;
  host?: string;
  origin?: string;
}): Request {
  const headers: Record<string, string | undefined> = {
    cookie: opts.cookie,
    host: opts.host ?? 'breathewise.example',
    origin: opts.origin,
  };
  return {
    headers,
    method: opts.method ?? 'GET',
    path: opts.path ?? '/household',
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as Request;
}

function makeMockResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: unknown = null;
  const res = {
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      jsonBody = body;
      return this;
    },
  };
  return {
    res: res as unknown as Response,
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getBody: () => jsonBody,
  };
}

afterEach(() => {
  delete process.env.NODE_ENV;
  while (openDbs.length > 0) {
    try {
      openDbs.pop()!.close();
    } catch {
      // closed
    }
  }
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('server/routes/session cookie helpers & middleware', () => {
  it('extracts breathewise_session token from single, multiple, missing, or malformed cookies', () => {
    expect(extractSessionToken(makeMockRequest({}))).toBeUndefined();
    expect(
      extractSessionToken(makeMockRequest({ cookie: 'other=123; malformed;;' }))
    ).toBeUndefined();
    expect(extractSessionToken(makeMockRequest({ cookie: 'breathewise_session=' }))).toBe('');
    expect(
      extractSessionToken(
        makeMockRequest({
          cookie: 'theme=light; breathewise_session=tok_abc_123; tz=IST',
        })
      )
    ).toBe('tok_abc_123');
  });

  it('issues HttpOnly, SameSite=Lax, Path=/, Max-Age, and Secure cookie flags in production and reuses valid session', () => {
    const db = createTestDb();
    process.env.NODE_ENV = 'production';
    const handler = handleGetSession(db);

    const req1 = makeMockRequest({ path: '/session' });
    const mockRes1 = makeMockResponse();
    handler(req1, mockRes1.res);

    expect(mockRes1.getStatus()).toBe(201);
    const setCookie = mockRes1.getHeaders()['set-cookie'];
    expect(setCookie).toContain('breathewise_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('Max-Age=2592000');
    expect(setCookie).toContain('Secure');
    expect(mockRes1.getHeaders()['cache-control']).toBe('no-store');

    const cookiePair = setCookie.split(';')[0];
    const req2 = makeMockRequest({ cookie: cookiePair, path: '/session' });
    const mockRes2 = makeMockResponse();
    handler(req2, mockRes2.res);

    expect(mockRes2.getStatus()).toBe(200);
    expect(mockRes2.getHeaders()['set-cookie']).toBeUndefined();
    expect((mockRes2.getBody() as { household: { id: string } }).household.id).toBe(
      (mockRes1.getBody() as { household: { id: string } }).household.id
    );
  });

  it('validates session cookies, enforces CSRF Origin check on mutations, and populates request household mapping', () => {
    const db = createTestDb();
    process.env.NODE_ENV = 'production';
    const hh = createHouseholdForBrowserSession(db);
    const token = 'valid-session-token';
    createBrowserSession(db, token, hh.id, new Date(Date.now() + 3600_000).toISOString());

    const middleware = requireSessionMiddleware(db);

    // Missing cookie -> 401
    const unauthRes = makeMockResponse();
    let called = false;
    middleware(makeMockRequest({ path: '/members' }), unauthRes.res, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(unauthRes.getStatus()).toBe(401);

    // Malformed / unknown cookie -> 401
    const badCookieRes = makeMockResponse();
    middleware(
      makeMockRequest({ cookie: 'breathewise_session=bogus', path: '/members' }),
      badCookieRes.res,
      () => {
        called = true;
      }
    );
    expect(called).toBe(false);
    expect(badCookieRes.getStatus()).toBe(401);

    // Unsafe method with cross-origin -> 403 CSRF_ORIGIN_REJECTED
    const csrfRes = makeMockResponse();
    middleware(
      makeMockRequest({
        cookie: `breathewise_session=${token}`,
        method: 'POST',
        path: '/members',
        host: 'app.breathewise.in',
        origin: 'http://app.breathewise.in',
      }),
      csrfRes.res,
      () => {
        called = true;
      }
    );
    expect(called).toBe(false);
    expect(csrfRes.getStatus()).toBe(403);

    // Valid cookie + HTTPS same-origin -> passes and binds household ID
    const okReq = makeMockRequest({
      cookie: `breathewise_session=${token}`,
      method: 'POST',
      path: '/members',
      host: 'app.breathewise.in',
      origin: 'https://app.breathewise.in',
    });
    const okRes = makeMockResponse();
    middleware(okReq, okRes.res, () => {
      called = true;
    });
    expect(called).toBe(true);
    expect(getSessionHouseholdId(okReq)).toBe(hh.id);
    expect(getRequestHousehold(okReq, db).id).toBe(hh.id);
  });
});
