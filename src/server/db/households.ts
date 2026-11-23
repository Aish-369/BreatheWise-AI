import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type {
  ActivityRoutineInput,
  FamilyMemberInput,
  HouseholdInput,
  HouseholdProfile,
  SensitivityTag,
} from '../../shared/types';
import { BadRequestError } from '../errors';
import { runInTransaction, safeJsonParse, shortUuid } from './connection';

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

function insertDemoMembers(db: DatabaseSync, householdId: string, now: string): void {
  const members: Array<FamilyMemberInput & { id: string }> = [
    {
      id: 'mem-aarav',
      name: 'Member 1',
      ageGroup: 'school_child',
      activityPreference: 'outdoor_play',
      routineFlexibility: 'flexible',
    },
    {
      id: 'mem-sunanda',
      name: 'Member 2',
      ageGroup: 'older_adult',
      activityPreference: 'morning_walk',
      routineFlexibility: 'flexible',
    },
    {
      id: 'mem-priya',
      name: 'Member 3',
      ageGroup: 'adult',
      activityPreference: 'commute',
      routineFlexibility: 'fixed',
    },
    {
      id: 'mem-vikram',
      name: 'Member 4',
      ageGroup: 'adult',
      activityPreference: 'outdoor_exercise',
      routineFlexibility: 'flexible',
    },
  ];
  const stmt = db.prepare(
    `INSERT INTO family_members (id, household_id, name, age_group, activity_preference, routine_flexibility, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const m of members) {
    stmt.run(
      m.id,
      householdId,
      m.name,
      m.ageGroup,
      m.activityPreference,
      m.routineFlexibility,
      now,
      now
    );
  }
}

function insertDemoRoutines(db: DatabaseSync, householdId: string, now: string): void {
  const routines: Array<ActivityRoutineInput & { id: string }> = [
    {
      id: 'rt-school-bus',
      title: 'School commute & morning assembly',
      environment: 'outdoor',
      flexibility: 'fixed',
      preferredWindow: '06:00-09:00',
      memberIds: ['mem-aarav', 'mem-priya'],
      notes: 'Fixed school timing',
    },
    {
      id: 'rt-morning-walk',
      title: 'Neighborhood morning walk',
      environment: 'outdoor',
      flexibility: 'flexible',
      preferredWindow: '06:00-09:00',
      memberIds: ['mem-sunanda', 'mem-vikram'],
      notes: 'Can shift to afternoon or move indoors',
    },
    {
      id: 'rt-evening-play',
      title: 'Evening park play',
      environment: 'outdoor',
      flexibility: 'flexible',
      preferredWindow: '16:00-19:00',
      memberIds: ['mem-aarav'],
      notes: 'Flexible playground time',
    },
    {
      id: 'rt-indoor-study',
      title: 'Indoor study & reading hour',
      environment: 'indoor',
      flexibility: 'fixed',
      preferredWindow: '19:00-22:00',
      memberIds: ['mem-aarav', 'mem-sunanda'],
      notes: 'Indoor quiet evening',
    },
  ];
  const stmt = db.prepare(
    `INSERT INTO activity_routines (id, household_id, title, environment, flexibility, preferred_window, member_ids_json, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const r of routines) {
    stmt.run(
      r.id,
      householdId,
      r.title,
      r.environment,
      r.flexibility,
      r.preferredWindow,
      JSON.stringify(r.memberIds),
      r.notes ?? '',
      now,
      now
    );
  }
}

function insertDemoLocations(db: DatabaseSync, householdId: string, now: string): void {
  const stmt = db.prepare(
    `INSERT INTO locations (id, household_id, city, locality, label, is_primary, latitude, longitude, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    'loc-demo-pune',
    householdId,
    'Pune',
    'Shivajinagar / Deccan',
    'Pune · Shivajinagar / Deccan',
    1,
    18.5204,
    73.8567,
    now,
    now
  );
  stmt.run(
    'loc-demo-ahilyanagar',
    householdId,
    'Ahilyanagar',
    'Municipal Center',
    'Ahilyanagar · Municipal Center',
    0,
    19.0948,
    74.748,
    now,
    now
  );
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
