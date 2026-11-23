import type { Migration } from './helpers';

export const migration005: Migration = {
  version: 5,
  name: '005_household_browser_sessions',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_sessions (
        token_hash TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_app_sessions_household
        ON app_sessions(household_id);
      CREATE INDEX IF NOT EXISTS idx_app_sessions_expiry
        ON app_sessions(expires_at);
    `);
    db.exec('DELETE FROM app_sessions WHERE expires_at <= CURRENT_TIMESTAMP;');
  },
};
