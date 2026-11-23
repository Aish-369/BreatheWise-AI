import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export interface BrowserSessionRecord {
  householdId: string;
  expiresAt: string;
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function createBrowserSession(
  db: DatabaseSync,
  token: string,
  householdId: string,
  expiresAt: string
): void {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO app_sessions (token_hash, household_id, created_at, expires_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(hashSessionToken(token), householdId, now, expiresAt, now);
}

export function getBrowserSession(db: DatabaseSync, token: string): BrowserSessionRecord | null {
  const now = new Date().toISOString();
  const tokenHash = hashSessionToken(token);
  const row = db
    .prepare(
      `SELECT household_id, expires_at FROM app_sessions
     WHERE token_hash = ? AND expires_at > ?`
    )
    .get(tokenHash, now) as { household_id: string; expires_at: string } | undefined;
  if (!row) {
    db.prepare('DELETE FROM app_sessions WHERE token_hash = ? AND expires_at <= ?').run(
      tokenHash,
      now
    );
    return null;
  }
  db.prepare('UPDATE app_sessions SET last_seen_at = ? WHERE token_hash = ?').run(now, tokenHash);
  return { householdId: row.household_id, expiresAt: row.expires_at };
}

export function revokeBrowserSession(db: DatabaseSync, token: string): void {
  db.prepare('DELETE FROM app_sessions WHERE token_hash = ?').run(hashSessionToken(token));
}
