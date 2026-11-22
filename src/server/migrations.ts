import type { DatabaseSync } from 'node:sqlite';

interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

function hasColumn(db: DatabaseSync, tableName: string, columnName: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === columnName);
}

const MIGRATIONS: Migration[] = [
  {
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
  },
  {
    version: 2,
    name: '002_locations_settings_providers_evidence_and_indexes',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS locations (
          id TEXT PRIMARY KEY,
          household_id TEXT NOT NULL,
          city TEXT NOT NULL,
          locality TEXT NOT NULL DEFAULT '',
          label TEXT NOT NULL,
          is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
          latitude REAL,
          longitude REAL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_settings (
          household_id TEXT PRIMARY KEY,
          language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'mr', 'hi')),
          use_demo_fixtures INTEGER NOT NULL DEFAULT 1 CHECK (use_demo_fixtures IN (0, 1)),
          simulate_outage INTEGER NOT NULL DEFAULT 0 CHECK (simulate_outage IN (0, 1)),
          default_city TEXT NOT NULL DEFAULT 'Pune',
          updated_at TEXT NOT NULL,
          FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS data_providers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          base_url TEXT NOT NULL,
          requires_api_key INTEGER NOT NULL DEFAULT 0 CHECK (requires_api_key IN (0, 1)),
          status TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS data_licenses (
          id TEXT PRIMARY KEY,
          provider_id TEXT NOT NULL,
          license_name TEXT NOT NULL,
          attribution_text TEXT NOT NULL,
          commercial_allowed INTEGER NOT NULL DEFAULT 1 CHECK (commercial_allowed IN (0, 1)),
          attribution_required INTEGER NOT NULL DEFAULT 1 CHECK (attribution_required IN (0, 1)),
          license_url TEXT NOT NULL DEFAULT '',
          FOREIGN KEY (provider_id) REFERENCES data_providers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS recommendations (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          household_id TEXT NOT NULL,
          rec_key TEXT NOT NULL,
          title_key TEXT NOT NULL,
          severity TEXT NOT NULL,
          confidence_key TEXT NOT NULL,
          applicable_members_json TEXT NOT NULL,
          source_timestamp TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (plan_id) REFERENCES protection_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS plan_evidence (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          snapshot_id TEXT,
          provider_label TEXT NOT NULL,
          station_or_grid_id TEXT NOT NULL,
          data_type TEXT NOT NULL,
          freshness TEXT NOT NULL,
          measured_at TEXT,
          retrieved_at TEXT NOT NULL,
          pm25 REAL,
          pm10 REAL,
          aqi_value REAL,
          is_demo_fixture INTEGER NOT NULL DEFAULT 0 CHECK (is_demo_fixture IN (0, 1)),
          FOREIGN KEY (plan_id) REFERENCES protection_plans(id) ON DELETE CASCADE,
          FOREIGN KEY (snapshot_id) REFERENCES environmental_snapshots(id) ON DELETE SET NULL
        );
      `);

      // Non-destructive column additions on existing mutable tables
      if (!hasColumn(db, 'family_members', 'updated_at')) {
        db.exec(`ALTER TABLE family_members ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`);
        db.exec(`UPDATE family_members SET updated_at = created_at WHERE updated_at = '';`);
      }
      if (!hasColumn(db, 'activity_routines', 'updated_at')) {
        db.exec(`ALTER TABLE activity_routines ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`);
        db.exec(`UPDATE activity_routines SET updated_at = created_at WHERE updated_at = '';`);
      }

      // Indexes for foreign keys & hot read queries
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_family_members_household ON family_members(household_id);
        CREATE INDEX IF NOT EXISTS idx_activity_routines_household ON activity_routines(household_id);
        CREATE INDEX IF NOT EXISTS idx_locations_household ON locations(household_id, is_primary DESC);
        CREATE INDEX IF NOT EXISTS idx_snapshots_city_retrieved ON environmental_snapshots(city, retrieved_at DESC);
        CREATE INDEX IF NOT EXISTS idx_forecasts_city_window ON cams_forecasts(city, time_window);
        CREATE INDEX IF NOT EXISTS idx_plans_household_generated ON protection_plans(household_id, generated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_recommendations_plan ON recommendations(plan_id);
        CREATE INDEX IF NOT EXISTS idx_plan_evidence_plan ON plan_evidence(plan_id);
        CREATE INDEX IF NOT EXISTS idx_scenario_runs_household ON scenario_runs(household_id, created_at DESC);
      `);

      const now = new Date().toISOString();

      // Seed persistent provider & license registry idempotently
      const insertProvider = db.prepare(`
        INSERT OR IGNORE INTO data_providers (id, name, base_url, requires_api_key, status, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertProvider.run(
        'cpcb',
        'CPCB / data.gov.in',
        'https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69',
        1,
        'configured_pending_key',
        'Official India CAAQMS station observations via data.gov.in under GODL.',
        now
      );
      insertProvider.run(
        'openaq',
        'OpenAQ API v3',
        'https://api.openaq.org/v3',
        1,
        'configured_pending_key',
        'Aggregated global ground-station observations (requires free X-API-Key).',
        now
      );
      insertProvider.run(
        'cams_manual',
        'Copernicus Atmosphere Monitoring Service (CAMS)',
        'https://ads.atmosphere.copernicus.eu',
        0,
        'manual_import',
        'Coarse ~40 km regional atmospheric forecast imported locally via validated CSV/JSON.',
        now
      );

      const insertLicense = db.prepare(`
        INSERT OR IGNORE INTO data_licenses (id, provider_id, license_name, attribution_text, commercial_allowed, attribution_required, license_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertLicense.run(
        'lic-cpcb-godl',
        'cpcb',
        'Government Open Data License – India (GODL)',
        'Contains data sourced from the Central Pollution Control Board (CPCB) via data.gov.in under GODL.',
        1,
        1,
        'https://data.gov.in/government-open-data-license-india'
      );
      insertLicense.run(
        'lic-openaq-v3',
        'openaq',
        'OpenAQ Aggregated Open Data (per-station licenses via /v3/licenses)',
        'Data aggregated via OpenAQ (https://openaq.org)',
        1,
        1,
        'https://docs.openaq.org/about/licenses'
      );
      insertLicense.run(
        'lic-cams-copernicus',
        'cams_manual',
        'Copernicus Open License (Free, Worldwide, Commercial Allowed)',
        `Generated using Copernicus Atmosphere Monitoring Service information ${new Date().getFullYear()}`,
        1,
        1,
        'https://atmosphere.copernicus.eu/'
      );

      // Non-destructively backfill user_settings and default locations for any existing households
      const existingHouseholds = db
        .prepare('SELECT id, city, locality, language FROM households')
        .all() as Array<{ id: string; city: string; locality: string | null; language: string }>;

      const insertSettings = db.prepare(`
        INSERT OR IGNORE INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
        VALUES (?, ?, 1, 0, ?, ?)
      `);
      const countLocations = db.prepare('SELECT COUNT(*) as c FROM locations WHERE household_id = ?');
      const insertLoc = db.prepare(`
        INSERT OR IGNORE INTO locations (id, household_id, city, locality, label, is_primary, latitude, longitude, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const hh of existingHouseholds) {
        const safeLang = hh.language === 'mr' || hh.language === 'hi' ? hh.language : 'en';
        insertSettings.run(hh.id, safeLang, hh.city || 'Pune', now);

        const locCount = (countLocations.get(hh.id) as { c: number }).c;
        if (locCount === 0) {
          const isPunePrimary = hh.city.toLowerCase() === 'pune';
          insertLoc.run(
            `loc-${hh.id}-pune`,
            hh.id,
            'Pune',
            isPunePrimary ? hh.locality || 'Shivajinagar / Deccan' : 'Shivajinagar / Deccan',
            'Pune · Shivajinagar / Deccan',
            isPunePrimary ? 1 : 0,
            18.5204,
            73.8567,
            now,
            now
          );
          insertLoc.run(
            `loc-${hh.id}-ahilyanagar`,
            hh.id,
            'Ahilyanagar',
            !isPunePrimary && hh.city.toLowerCase() === 'ahilyanagar' ? hh.locality || 'Municipal Center' : 'Municipal Center',
            'Ahilyanagar · Municipal Center',
            hh.city.toLowerCase() === 'ahilyanagar' ? 1 : 0,
            19.0948,
            74.748,
            now,
            now
          );
        }
      }
    },
  },
  {
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
  },
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
