import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { HouseholdInput, HouseholdProfile, SensitivityTag } from '../../shared/types';
import { BadRequestError } from '../errors';
import { runInTransaction, safeJsonParse, shortUuid } from './connection';
import { insertDemoLocations, insertDemoMembers, insertDemoRoutines } from './demoSeed';

function mapHouseholdRow(row: Record<string, unknown>): HouseholdProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    city: String(row.city),
    locality: String(row.locality ?? ''),
    language: (String(row.language) as HouseholdProfile['language']) ?? 'en',
    isDemoProfile: Number(row.is_demo_profile) === 1,
    sensitivityTags: safeJsonParse<SensitivityTag[]>(row.sensitivity_tags_json, []),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function seedDemoHouseholdIfEmpty(db: DatabaseSync): HouseholdProfile {
  const existing = db.prepare('SELECT * FROM households LIMIT 1').get() as
    Record<string, unknown> | undefined;
  if (existing) return mapHouseholdRow(existing);
  return createDemoHousehold(db);
}

export function createDemoHousehold(db: DatabaseSync): HouseholdProfile {
  return runInTransaction(db, () => {
    const now = new Date().toISOString();
    const householdId = 'hh-demo-pune';
    db.prepare(
      `INSERT INTO households (id, name, city, locality, language, is_demo_profile, sensitivity_tags_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(householdId, 'My Family', 'Pune', 'Shivajinagar / Deccan', 'en', 1, '[]', now, now);

    insertDemoMembers(db, householdId, now);
    insertDemoRoutines(db, householdId, now);
    insertDemoLocations(db, householdId, now);

    db.prepare(
      `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(householdId, 'en', 1, 0, 'Pune', now);

    return getActiveHousehold(db)!;
  });
}

export function getActiveHousehold(db: DatabaseSync): HouseholdProfile | null {
  const row = db.prepare('SELECT * FROM households ORDER BY updated_at DESC LIMIT 1').get() as
    Record<string, unknown> | undefined;
  return row ? mapHouseholdRow(row) : null;
}

export function getHouseholdById(db: DatabaseSync, householdId: string): HouseholdProfile | null {
  const row = db.prepare('SELECT * FROM households WHERE id = ?').get(householdId) as
    Record<string, unknown> | undefined;
  return row ? mapHouseholdRow(row) : null;
}

export function createHouseholdForBrowserSession(db: DatabaseSync): HouseholdProfile {
  return runInTransaction(db, () => {
    const now = new Date().toISOString();
    const id = `hh-${crypto.randomUUID()}`;
    db.prepare(
      `INSERT INTO households (id, name, city, locality, language, is_demo_profile, sensitivity_tags_json, created_at, updated_at)
       VALUES (?, 'My Family', 'Pune', '', 'en', 0, '[]', ?, ?)`
    ).run(id, now, now);
    db.prepare(
      `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
       VALUES (?, 'en', 1, 0, 'Pune', ?)`
    ).run(id, now);
    db.prepare(
      `INSERT INTO locations (id, household_id, city, locality, label, is_primary, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, 'Pune', '', 'Pune', 1, NULL, NULL, ?, ?)`
    ).run(`loc-${crypto.randomUUID()}`, id, now, now);
    return getHouseholdById(db, id)!;
  });
}

export function updateHouseholdForId(
  db: DatabaseSync,
  householdId: string,
  input: HouseholdInput,
  isDemoProfile = false
): HouseholdProfile {
  return runInTransaction(db, () => {
    const existing = getHouseholdById(db, householdId);
    if (!existing) throw new BadRequestError('Household not found for this browser session.');
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE households SET name = ?, city = ?, locality = ?, language = ?, is_demo_profile = ?,
       sensitivity_tags_json = ?, updated_at = ? WHERE id = ?`
    ).run(
      input.name,
      input.city,
      input.locality ?? '',
      input.language,
      isDemoProfile ? 1 : 0,
      JSON.stringify(input.sensitivityTags ?? []),
      now,
      householdId
    );
    db.prepare(
      `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
       VALUES (?, ?, 0, 0, ?, ?)
       ON CONFLICT(household_id) DO UPDATE SET language = excluded.language,
       default_city = excluded.default_city, updated_at = excluded.updated_at`
    ).run(householdId, input.language, input.city, now);
    return getHouseholdById(db, householdId)!;
  });
}

export function upsertHousehold(
  db: DatabaseSync,
  input: HouseholdInput,
  isDemoProfile = false
): HouseholdProfile {
  return runInTransaction(db, () => {
    const existing = getActiveHousehold(db);
    const now = new Date().toISOString();
    const sensitivityJson = JSON.stringify(input.sensitivityTags ?? []);
    if (existing) {
      db.prepare(
        `UPDATE households
         SET name = ?, city = ?, locality = ?, language = ?, is_demo_profile = ?, sensitivity_tags_json = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        input.name,
        input.city,
        input.locality ?? '',
        input.language,
        isDemoProfile ? 1 : 0,
        sensitivityJson,
        now,
        existing.id
      );
      db.prepare(
        `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
         VALUES (?, ?, 0, 0, ?, ?)
         ON CONFLICT(household_id) DO UPDATE SET language = excluded.language, default_city = excluded.default_city, updated_at = excluded.updated_at`
      ).run(existing.id, input.language, input.city, now);
      return getActiveHousehold(db)!;
    }

    const id = `hh-${Date.now()}-${shortUuid()}`;
    db.prepare(
      `INSERT INTO households (id, name, city, locality, language, is_demo_profile, sensitivity_tags_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.name,
      input.city,
      input.locality ?? '',
      input.language,
      isDemoProfile ? 1 : 0,
      sensitivityJson,
      now,
      now
    );
    db.prepare(
      `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
       VALUES (?, ?, 0, 0, ?, ?)`
    ).run(id, input.language, input.city, now);

    const locLabel = input.locality?.trim()
      ? `${input.city} · ${input.locality.trim()}`
      : input.city;
    db.prepare(
      `INSERT INTO locations (id, household_id, city, locality, label, is_primary, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, NULL, NULL, ?, ?)`
    ).run(
      `loc-${Date.now()}-${shortUuid()}`,
      id,
      input.city,
      input.locality ?? '',
      locLabel,
      now,
      now
    );

    return getActiveHousehold(db)!;
  });
}

export function clearAllLocalData(db: DatabaseSync): void {
  runInTransaction(db, () => {
    db.exec(`
      DELETE FROM plan_evidence;
      DELETE FROM recommendations;
      DELETE FROM scenario_runs;
      DELETE FROM protection_plans;
      DELETE FROM locations;
      DELETE FROM user_settings;
      DELETE FROM activity_routines;
      DELETE FROM family_members;
      DELETE FROM households;
      DELETE FROM environmental_snapshots;
      DELETE FROM cams_forecasts;
    `);
  });
}

export function resetToDemoProfile(db: DatabaseSync): HouseholdProfile {
  clearAllLocalData(db);
  return createDemoHousehold(db);
}
