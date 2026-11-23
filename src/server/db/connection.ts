import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getSchemaVersion, runMigrations } from '../migrations';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'breathewise.db');

let dbInstance: DatabaseSync | null = null;

export { getSchemaVersion, runMigrations };

export function shortUuid(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function runInTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) return dbInstance;

  const targetPath = customPath ?? DB_PATH;
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  runMigrations(db);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

/** Close the process-wide SQLite connection during graceful server shutdown. */
export function closeDb(): void {
  if (!dbInstance) return;
  dbInstance.close();
  dbInstance = null;
}
