import type { Migration } from './helpers';

export const migration001: Migration = {
  version: 1,
  name: '001_initial_core_tables',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        locality TEXT DEFAULT '',
        language TEXT NOT NULL DEFAULT 'en',
        is_demo_profile INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS family_members (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        name TEXT NOT NULL,
        age_group TEXT NOT NULL,
        activity_preference TEXT NOT NULL,
        routine_flexibility TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_routines (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        title TEXT NOT NULL,
        environment TEXT NOT NULL,
        flexibility TEXT NOT NULL,
        preferred_window TEXT NOT NULL,
        member_ids_json TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS environmental_snapshots (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_label TEXT NOT NULL,
        data_type TEXT NOT NULL,
        city TEXT NOT NULL,
        location_label TEXT NOT NULL,
        station_or_grid_id TEXT NOT NULL,
        spatial_resolution_note TEXT NOT NULL,
        pollutants_json TEXT NOT NULL,
        reported_aqi_india REAL,
        measured_at TEXT,
        retrieved_at TEXT NOT NULL,
        freshness TEXT NOT NULL,
        license_attribution TEXT NOT NULL,
        warnings_json TEXT NOT NULL,
        is_demo_fixture INTEGER NOT NULL DEFAULT 0,
        is_available INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS cams_forecasts (
        id TEXT PRIMARY KEY,
        city TEXT NOT NULL,
        time_window TEXT NOT NULL,
        forecast_date TEXT NOT NULL,
        expected_pm25 REAL,
        expected_pm10 REAL,
        expected_aqi_india REAL,
        trend TEXT NOT NULL,
        data_type TEXT NOT NULL DEFAULT 'forecast',
        provider_label TEXT NOT NULL,
        grid_resolution_note TEXT NOT NULL,
        issued_at TEXT NOT NULL,
        license_attribution TEXT NOT NULL,
        is_demo_fixture INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS protection_plans (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        city TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        aqi_value REAL,
        aqi_band TEXT NOT NULL,
        freshness TEXT NOT NULL,
        is_demo_fixture INTEGER NOT NULL DEFAULT 0,
        plan_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scenario_runs (
        id TEXT PRIMARY KEY,
        household_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        label TEXT NOT NULL,
        result_json TEXT NOT NULL
      );
    `);
  },
};
