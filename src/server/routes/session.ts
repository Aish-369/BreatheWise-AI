import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { NextFunction, Request, Response } from 'express';
import {
  createBrowserSession,
  createHouseholdForBrowserSession,
  getActiveHousehold,
  getBrowserSession,
  getHouseholdById,
  revokeBrowserSession,
  seedDemoHouseholdIfEmpty,
} from '../db';
import { NotFoundError } from '../errors';

const SESSION_COOKIE_NAME = 'breathewise_session=';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PUBLIC_API_PATHS = new Set([
  '/health',
  '/providers',
  '/session',
  '/local/reset-demo',
  '/local/clear',
]);

const sessionHouseholdByRequest = new WeakMap<Request, string>();

export function extractSessionToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(SESSION_COOKIE_NAME));
  return match?.slice(SESSION_COOKIE_NAME.length);
}

export function getSessionHouseholdId(req: Request): string | undefined {
  return sessionHouseholdByRequest.get(req);
}

export function getRequestHousehold(req: Request, db: DatabaseSync) {
  const id = sessionHouseholdByRequest.get(req);
  const household = id
    ? getHouseholdById(db, id)
    : (getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db));
  if (!household) {
    throw new NotFoundError('Household not found for this browser session.');
  }
  return household;
}

function isSameOriginHttps(req: Request): boolean {
  const origin = req.get('origin');
  try {
    const parsed = origin ? new URL(origin) : null;
    return Boolean(parsed && parsed.host === req.get('host') && parsed.protocol === 'https:');
  } catch {
    return false;
  }
}

export function handleGetSession(db: DatabaseSync) {
  return (req: Request, res: Response): void => {
    if (process.env.NODE_ENV !== 'production') {
      const household = getActiveHousehold(db) ?? seedDemoHouseholdIfEmpty(db);
      res.json({ authenticated: true, household });
      return;
    }

    const tokenFromCookie = extractSessionToken(req);
    const existing = tokenFromCookie ? getBrowserSession(db, tokenFromCookie) : null;
    const existingHousehold = existing ? getHouseholdById(db, existing.householdId) : null;
    if (existing && existingHousehold && !existingHousehold.isDemoProfile) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({ authenticated: true, household: existingHousehold });
      return;
    }

    if (tokenFromCookie && existing) revokeBrowserSession(db, tokenFromCookie);
    const token = crypto.randomBytes(32).toString('base64url');
    const household = createHouseholdForBrowserSession(db);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    createBrowserSession(db, token, household.id, expiresAt);

    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `breathewise_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`
    );
    res.setHeader('Cache-Control', 'no-store');
    res.status(201).json({ authenticated: true, household });
  };
}

export function requireSessionMiddleware(db: DatabaseSync) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (PUBLIC_API_PATHS.has(req.path) || process.env.NODE_ENV !== 'production') {
      next();
      return;
    }

    const token = extractSessionToken(req);
    const session = token ? getBrowserSession(db, token) : null;
    if (!session || !getHouseholdById(db, session.householdId)) {
      res.status(401).json({
        error: 'A valid browser session is required.',
        code: 'SESSION_REQUIRED',
      });
      return;
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isSameOriginHttps(req)) {
      res.status(403).json({
        error: 'Cross-origin request rejected.',
        code: 'CSRF_ORIGIN_REJECTED',
      });
      return;
    }

    sessionHouseholdByRequest.set(req, session.householdId);
    next();
  };
}
