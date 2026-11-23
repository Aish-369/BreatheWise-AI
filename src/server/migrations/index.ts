import type { DatabaseSync } from 'node:sqlite';
import { migration001 } from './001_initial_core_tables';
import { migration002 } from './002_locations_settings_providers_evidence_and_indexes';
import { migration003 } from './003_snapshot_classification_sensitivity_completion_and_rule_version';
import { migration004 } from './004_disable_demo_fixtures_by_default';
import { migration005 } from './005_household_browser_sessions';
import { migration006 } from './006_household_scoped_imported_forecasts';
import type { Migration } from './helpers';

export const MIGRATIONS: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
];

export function getSchemaVersion(db: DatabaseSync): number {
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'")
    .get();
  if (!tableExists) return 0;
  const row = db.prepare('SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations').get() as {
    v: number;
  };
  return Number(row.v ?? 0);
}

export function runMigrations(db: DatabaseSync): number {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const currentVersion = getSchemaVersion(db);
  const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pending) {
    db.exec('BEGIN IMMEDIATE;');
    try {
      migration.up(db);
      db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
        migration.version,
        migration.name,
        new Date().toISOString()
      );
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  return getSchemaVersion(db);
}
