import { hasColumn, type Migration } from './helpers';

export const migration003: Migration = {
  version: 3,
  name: '003_snapshot_classification_sensitivity_completion_and_rule_version',
  up: (db) => {
    if (!hasColumn(db, 'households', 'sensitivity_tags_json')) {
      db.exec(
        `ALTER TABLE households ADD COLUMN sensitivity_tags_json TEXT NOT NULL DEFAULT '[]';`
      );
    }
    if (!hasColumn(db, 'activity_routines', 'completed_date')) {
      db.exec(`ALTER TABLE activity_routines ADD COLUMN completed_date TEXT;`);
    }
    if (!hasColumn(db, 'environmental_snapshots', 'classification')) {
      db.exec(
        `ALTER TABLE environmental_snapshots ADD COLUMN classification TEXT NOT NULL DEFAULT 'unavailable';`
      );
      db.exec(`
        UPDATE environmental_snapshots
        SET classification = CASE
          WHEN is_available = 0 OR provider = 'unavailable' THEN 'unavailable'
          WHEN is_demo_fixture = 1 OR provider = 'demo_fixture' THEN 'demo_fixture'
          WHEN data_type = 'forecast' THEN 'forecast_only'
          WHEN freshness = 'stale' THEN 'historical_observation'
          ELSE 'verified_live'
        END;
      `);
    }
    if (!hasColumn(db, 'environmental_snapshots', 'weather_json')) {
      db.exec(
        `ALTER TABLE environmental_snapshots ADD COLUMN weather_json TEXT NOT NULL DEFAULT '{}';`
      );
    }
    if (!hasColumn(db, 'environmental_snapshots', 'coordinates_json')) {
      db.exec(`ALTER TABLE environmental_snapshots ADD COLUMN coordinates_json TEXT;`);
    }
    if (!hasColumn(db, 'environmental_snapshots', 'quality_json')) {
      db.exec(
        `ALTER TABLE environmental_snapshots ADD COLUMN quality_json TEXT NOT NULL DEFAULT '{}';`
      );
    }
    if (!hasColumn(db, 'protection_plans', 'rule_set_version')) {
      db.exec(
        `ALTER TABLE protection_plans ADD COLUMN rule_set_version TEXT NOT NULL DEFAULT '1.0.0';`
      );
    }

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_snapshots_city_measured
        ON environmental_snapshots(city, measured_at DESC);
      CREATE INDEX IF NOT EXISTS idx_snapshots_dedupe
        ON environmental_snapshots(provider, station_or_grid_id, measured_at);
    `);
  },
};
