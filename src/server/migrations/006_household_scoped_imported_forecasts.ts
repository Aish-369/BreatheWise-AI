import { hasColumn, type Migration } from './helpers';

export const migration006: Migration = {
  version: 6,
  name: '006_household_scoped_imported_forecasts',
  up: (db) => {
    if (!hasColumn(db, 'cams_forecasts', 'household_id')) {
      db.exec(
        'ALTER TABLE cams_forecasts ADD COLUMN household_id TEXT REFERENCES households(id) ON DELETE CASCADE;'
      );
    }
    // Attribute legacy non-demo imports to the one legacy active household so they
    // do not become globally visible after anonymous multi-household sessions are enabled.
    db.exec(`
      UPDATE cams_forecasts
      SET household_id = (SELECT id FROM households ORDER BY updated_at DESC LIMIT 1)
      WHERE household_id IS NULL AND is_demo_fixture = 0;
    `);
    db.exec(
      'CREATE INDEX IF NOT EXISTS idx_cams_forecasts_household_city ON cams_forecasts(household_id, city, time_window);'
    );
  },
};
