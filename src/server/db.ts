import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  ActivityRoutine,
  ActivityRoutineInput,
  DataProviderRecord,
  EnvironmentalSnapshot,
  FamilyMember,
  FamilyMemberInput,
  ForecastSlot,
  HouseholdInput,
  HouseholdProfile,
  LocationInput,
  ProtectionPlanResult,
  SavedLocation,
  ScenarioComparisonResult,
  SensitivityTag,
  UserSettings,
  UserSettingsInput,
} from '../shared/types';
import { BadRequestError } from './errors';
import { getSchemaVersion, runMigrations } from './migrations';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'breathewise.db');

let dbInstance: DatabaseSync | null = null;

export { getSchemaVersion };

function shortUuid(): string {
  return crypto.randomUUID().slice(0, 8);
}

function runInTransaction<T>(db: DatabaseSync, fn: () => T): T {
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

export function seedDemoHouseholdIfEmpty(db: DatabaseSync): HouseholdProfile {
  const existing = db.prepare('SELECT * FROM households LIMIT 1').get() as
    | Record<string, unknown>
    | undefined;
  if (existing) {
    return mapHouseholdRow(existing);
  }
  return createDemoHousehold(db);
}

export function createDemoHousehold(db: DatabaseSync): HouseholdProfile {
  return runInTransaction(db, () => {
    const now = new Date().toISOString();
    const householdId = 'hh-demo-pune';

    db.prepare(
      `INSERT INTO households (id, name, city, locality, language, is_demo_profile, sensitivity_tags_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      householdId,
      'Deshmukh Family (Demo Profile)',
      'Pune',
      'Shivajinagar / Deccan',
      'en',
      1,
      '[]',
      now,
      now
    );

    const members: Array<FamilyMemberInput & { id: string }> = [
      {
        id: 'mem-aarav',
        name: 'Aarav',
        ageGroup: 'school_child',
        activityPreference: 'outdoor_play',
        routineFlexibility: 'flexible',
      },
      {
        id: 'mem-sunanda',
        name: 'Sunanda',
        ageGroup: 'older_adult',
        activityPreference: 'morning_walk',
        routineFlexibility: 'flexible',
      },
      {
        id: 'mem-priya',
        name: 'Priya',
        ageGroup: 'adult',
        activityPreference: 'commute',
        routineFlexibility: 'fixed',
      },
      {
        id: 'mem-vikram',
        name: 'Vikram',
        ageGroup: 'adult',
        activityPreference: 'outdoor_exercise',
        routineFlexibility: 'flexible',
      },
    ];

    const insertMember = db.prepare(
      `INSERT INTO family_members (id, household_id, name, age_group, activity_preference, routine_flexibility, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const m of members) {
      insertMember.run(
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

    const insertRoutine = db.prepare(
      `INSERT INTO activity_routines (id, household_id, title, environment, flexibility, preferred_window, member_ids_json, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of routines) {
      insertRoutine.run(
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

    db.prepare(
      `INSERT INTO locations (id, household_id, city, locality, label, is_primary, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
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

    db.prepare(
      `INSERT INTO locations (id, household_id, city, locality, label, is_primary, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
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

    db.prepare(
      `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(householdId, 'en', 1, 0, 'Pune', now);

    return getActiveHousehold(db)!;
  });
}

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

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

function mapMemberRow(r: Record<string, unknown>): FamilyMember {
  return {
    id: String(r.id),
    householdId: String(r.household_id),
    name: String(r.name),
    ageGroup: String(r.age_group) as FamilyMember['ageGroup'],
    activityPreference: String(r.activity_preference) as FamilyMember['activityPreference'],
    routineFlexibility: String(r.routine_flexibility) as FamilyMember['routineFlexibility'],
    createdAt: String(r.created_at),
  };
}

function mapRoutineRow(r: Record<string, unknown>): ActivityRoutine {
  return {
    id: String(r.id),
    householdId: String(r.household_id),
    title: String(r.title),
    environment: String(r.environment) as ActivityRoutine['environment'],
    flexibility: String(r.flexibility) as ActivityRoutine['flexibility'],
    preferredWindow: String(r.preferred_window) as ActivityRoutine['preferredWindow'],
    memberIds: JSON.parse(String(r.member_ids_json)) as string[],
    notes: String(r.notes ?? ''),
    completedDate: r.completed_date === null || r.completed_date === undefined ? null : String(r.completed_date),
    createdAt: String(r.created_at),
  };
}

function mapLocationRow(r: Record<string, unknown>): SavedLocation {
  return {
    id: String(r.id),
    householdId: String(r.household_id),
    city: String(r.city),
    locality: String(r.locality ?? ''),
    label: String(r.label),
    isPrimary: Number(r.is_primary) === 1,
    latitude: r.latitude === null || r.latitude === undefined ? null : Number(r.latitude),
    longitude: r.longitude === null || r.longitude === undefined ? null : Number(r.longitude),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapUserSettingsRow(r: Record<string, unknown>): UserSettings {
  return {
    householdId: String(r.household_id),
    language: String(r.language) as UserSettings['language'],
    useDemoFixtures: Number(r.use_demo_fixtures) === 1,
    simulateOutage: Number(r.simulate_outage) === 1,
    defaultCity: String(r.default_city),
    updatedAt: String(r.updated_at),
  };
}

export function getActiveHousehold(db: DatabaseSync): HouseholdProfile | null {
  const row = db.prepare('SELECT * FROM households ORDER BY updated_at DESC LIMIT 1').get() as
    | Record<string, unknown>
    | undefined;
  return row ? mapHouseholdRow(row) : null;
}

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

export function getBrowserSession(
  db: DatabaseSync,
  token: string
): BrowserSessionRecord | null {
  const now = new Date().toISOString();
  const row = db.prepare(
    `SELECT household_id, expires_at FROM app_sessions
     WHERE token_hash = ? AND expires_at > ?`
  ).get(hashSessionToken(token), now) as
    | { household_id: string; expires_at: string }
    | undefined;
  if (!row) return null;
  db.prepare('UPDATE app_sessions SET last_seen_at = ? WHERE token_hash = ?')
    .run(now, hashSessionToken(token));
  return { householdId: row.household_id, expiresAt: row.expires_at };
}

export function revokeBrowserSession(db: DatabaseSync, token: string): void {
  db.prepare('DELETE FROM app_sessions WHERE token_hash = ?').run(hashSessionToken(token));
}

export function getHouseholdById(db: DatabaseSync, householdId: string): HouseholdProfile | null {
  const row = db.prepare('SELECT * FROM households WHERE id = ?').get(householdId) as
    | Record<string, unknown>
    | undefined;
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
       VALUES (?, 'en', 0, 0, 'Pune', ?)`
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
    ).run(input.name, input.city, input.locality ?? '', input.language, isDemoProfile ? 1 : 0,
      JSON.stringify(input.sensitivityTags ?? []), now, householdId);
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
         ON CONFLICT(household_id) DO UPDATE SET
           language = excluded.language,
           default_city = excluded.default_city,
           updated_at = excluded.updated_at`
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
    ).run(`loc-${Date.now()}-${shortUuid()}`, id, input.city, input.locality ?? '', locLabel, now, now);

    return getActiveHousehold(db)!;
  });
}

export function listMembers(db: DatabaseSync, householdId: string): FamilyMember[] {
  const rows = db
    .prepare('SELECT * FROM family_members WHERE household_id = ? ORDER BY created_at ASC')
    .all(householdId) as Array<Record<string, unknown>>;
  return rows.map(mapMemberRow);
}

export function addMember(
  db: DatabaseSync,
  householdId: string,
  input: FamilyMemberInput
): FamilyMember {
  const id =
    input.id && input.id.trim().length > 0
      ? input.id.trim()
      : `mem-${Date.now()}-${shortUuid()}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO family_members (id, household_id, name, age_group, activity_preference, routine_flexibility, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    householdId,
    input.name,
    input.ageGroup,
    input.activityPreference,
    input.routineFlexibility,
    now,
    now
  );
  return {
    id,
    householdId,
    name: input.name,
    ageGroup: input.ageGroup,
    activityPreference: input.activityPreference,
    routineFlexibility: input.routineFlexibility,
    createdAt: now,
  };
}

export function updateMember(
  db: DatabaseSync,
  householdId: string,
  memberId: string,
  input: FamilyMemberInput
): FamilyMember | null {
  const now = new Date().toISOString();
  const res = db
    .prepare(
      `UPDATE family_members
       SET name = ?, age_group = ?, activity_preference = ?, routine_flexibility = ?, updated_at = ?
       WHERE id = ? AND household_id = ?`
    )
    .run(
      input.name,
      input.ageGroup,
      input.activityPreference,
      input.routineFlexibility,
      now,
      memberId,
      householdId
    );
  if (Number(res.changes) === 0) return null;

  const row = db
    .prepare('SELECT * FROM family_members WHERE id = ? AND household_id = ?')
    .get(memberId, householdId) as Record<string, unknown> | undefined;
  return row ? mapMemberRow(row) : null;
}

export function deleteMember(
  db: DatabaseSync,
  householdId: string,
  memberId: string
): boolean {
  return runInTransaction(db, () => {
    const res = db
      .prepare('DELETE FROM family_members WHERE id = ? AND household_id = ?')
      .run(memberId, householdId);
    if (Number(res.changes) === 0) return false;

    const routines = listRoutines(db, householdId);
    const now = new Date().toISOString();
    for (const rt of routines) {
      if (rt.memberIds.includes(memberId)) {
        const nextIds = rt.memberIds.filter((id) => id !== memberId);
        if (nextIds.length === 0) {
          db.prepare('DELETE FROM activity_routines WHERE id = ? AND household_id = ?').run(
            rt.id,
            householdId
          );
        } else {
          db.prepare(
            'UPDATE activity_routines SET member_ids_json = ?, updated_at = ? WHERE id = ? AND household_id = ?'
          ).run(JSON.stringify(nextIds), now, rt.id, householdId);
        }
      }
    }
    return true;
  });
}

function assertMembersBelongToHousehold(
  db: DatabaseSync,
  householdId: string,
  memberIds: string[]
): void {
  const validRows = db
    .prepare('SELECT id FROM family_members WHERE household_id = ?')
    .all(householdId) as Array<{ id: string }>;
  const validIds = new Set(validRows.map((r) => r.id));
  const missing = memberIds.filter((id) => !validIds.has(id));
  if (missing.length > 0) {
    throw new BadRequestError(
      `Unknown family member ID(s) for active household: ${missing.join(', ')}`
    );
  }
}

export function listRoutines(db: DatabaseSync, householdId: string): ActivityRoutine[] {
  const rows = db
    .prepare('SELECT * FROM activity_routines WHERE household_id = ? ORDER BY created_at ASC')
    .all(householdId) as Array<Record<string, unknown>>;
  return rows.map(mapRoutineRow);
}

export function upsertRoutine(
  db: DatabaseSync,
  householdId: string,
  input: ActivityRoutineInput
): ActivityRoutine {
  assertMembersBelongToHousehold(db, householdId, input.memberIds);
  const now = new Date().toISOString();

  if (input.id) {
    const existing = db
      .prepare('SELECT id FROM activity_routines WHERE id = ? AND household_id = ?')
      .get(input.id, householdId);
    if (existing) {
      db.prepare(
        `UPDATE activity_routines
         SET title = ?, environment = ?, flexibility = ?, preferred_window = ?, member_ids_json = ?, notes = ?, updated_at = ?
         WHERE id = ? AND household_id = ?`
      ).run(
        input.title,
        input.environment,
        input.flexibility,
        input.preferredWindow,
        JSON.stringify(input.memberIds),
        input.notes ?? '',
        now,
        input.id,
        householdId
      );
      return listRoutines(db, householdId).find((r) => r.id === input.id)!;
    }
  }

  const id = `rt-${Date.now()}-${shortUuid()}`;
  db.prepare(
    `INSERT INTO activity_routines (id, household_id, title, environment, flexibility, preferred_window, member_ids_json, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    householdId,
    input.title,
    input.environment,
    input.flexibility,
    input.preferredWindow,
    JSON.stringify(input.memberIds),
    input.notes ?? '',
    now,
    now
  );
  return {
    id,
    householdId,
    title: input.title,
    environment: input.environment,
    flexibility: input.flexibility,
    preferredWindow: input.preferredWindow,
    memberIds: input.memberIds,
    notes: input.notes ?? '',
    completedDate: input.completedDate ?? null,
    createdAt: now,
  };
}

export function updateRoutine(
  db: DatabaseSync,
  householdId: string,
  routineId: string,
  input: ActivityRoutineInput
): ActivityRoutine | null {
  const existing = db
    .prepare('SELECT id FROM activity_routines WHERE id = ? AND household_id = ?')
    .get(routineId, householdId);
  if (!existing) return null;

  assertMembersBelongToHousehold(db, householdId, input.memberIds);

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE activity_routines
     SET title = ?, environment = ?, flexibility = ?, preferred_window = ?, member_ids_json = ?, notes = ?, updated_at = ?
     WHERE id = ? AND household_id = ?`
  ).run(
    input.title,
    input.environment,
    input.flexibility,
    input.preferredWindow,
    JSON.stringify(input.memberIds),
    input.notes ?? '',
    now,
    routineId,
    householdId
  );

  const row = db
    .prepare('SELECT * FROM activity_routines WHERE id = ? AND household_id = ?')
    .get(routineId, householdId) as Record<string, unknown> | undefined;
  return row ? mapRoutineRow(row) : null;
}

export function setRoutineCompletion(
  db: DatabaseSync,
  householdId: string,
  routineId: string,
  completed: boolean,
  dateStr: string = new Date().toISOString().slice(0, 10)
): ActivityRoutine | null {
  const now = new Date().toISOString();
  const nextCompletedDate = completed ? dateStr : null;
  const res = db
    .prepare(
      `UPDATE activity_routines
       SET completed_date = ?, updated_at = ?
       WHERE id = ? AND household_id = ?`
    )
    .run(nextCompletedDate, now, routineId, householdId);
  if (Number(res.changes) === 0) return null;

  const row = db
    .prepare('SELECT * FROM activity_routines WHERE id = ? AND household_id = ?')
    .get(routineId, householdId) as Record<string, unknown> | undefined;
  return row ? mapRoutineRow(row) : null;
}

export function deleteRoutine(
  db: DatabaseSync,
  householdId: string,
  routineId: string
): boolean {
  const res = db
    .prepare('DELETE FROM activity_routines WHERE id = ? AND household_id = ?')
    .run(routineId, householdId);
  return Number(res.changes) > 0;
}

// ---------- Locations CRUD ----------

export function listLocations(db: DatabaseSync, householdId: string): SavedLocation[] {
  const rows = db
    .prepare(
      'SELECT * FROM locations WHERE household_id = ? ORDER BY is_primary DESC, created_at ASC'
    )
    .all(householdId) as Array<Record<string, unknown>>;
  return rows.map(mapLocationRow);
}

function syncPrimaryLocationToHousehold(
  db: DatabaseSync,
  householdId: string,
  city: string,
  locality: string,
  now: string
): void {
  db.prepare(
    'UPDATE households SET city = ?, locality = ?, updated_at = ? WHERE id = ?'
  ).run(city, locality, now, householdId);

  db.prepare(
    `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
     VALUES (?, (SELECT language FROM households WHERE id = ?), 1, 0, ?, ?)
     ON CONFLICT(household_id) DO UPDATE SET
       default_city = excluded.default_city,
       updated_at = excluded.updated_at`
  ).run(householdId, householdId, city, now);
}

export function createLocation(
  db: DatabaseSync,
  householdId: string,
  input: LocationInput
): SavedLocation {
  return runInTransaction(db, () => {
    const now = new Date().toISOString();
    const id = `loc-${Date.now()}-${shortUuid()}`;
    const countRow = db
      .prepare('SELECT COUNT(*) as c FROM locations WHERE household_id = ?')
      .get(householdId) as { c: number };
    const shouldBePrimary = Boolean(input.isPrimary) || countRow.c === 0;

    if (shouldBePrimary) {
      db.prepare('UPDATE locations SET is_primary = 0, updated_at = ? WHERE household_id = ?').run(
        now,
        householdId
      );
    }

    db.prepare(
      `INSERT INTO locations (id, household_id, city, locality, label, is_primary, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      householdId,
      input.city,
      input.locality ?? '',
      input.label,
      shouldBePrimary ? 1 : 0,
      input.latitude ?? null,
      input.longitude ?? null,
      now,
      now
    );

    if (shouldBePrimary) {
      syncPrimaryLocationToHousehold(db, householdId, input.city, input.locality ?? '', now);
    }

    const row = db
      .prepare('SELECT * FROM locations WHERE id = ? AND household_id = ?')
      .get(id, householdId) as Record<string, unknown>;
    return mapLocationRow(row);
  });
}

export function updateLocation(
  db: DatabaseSync,
  householdId: string,
  locationId: string,
  input: LocationInput
): SavedLocation | null {
  return runInTransaction(db, () => {
    const existing = db
      .prepare('SELECT * FROM locations WHERE id = ? AND household_id = ?')
      .get(locationId, householdId) as Record<string, unknown> | undefined;
    if (!existing) return null;

    const now = new Date().toISOString();
    const wasPrimary = Number(existing.is_primary) === 1;
    const isPrimary = Boolean(input.isPrimary);

    if (isPrimary) {
      db.prepare(
        'UPDATE locations SET is_primary = 0, updated_at = ? WHERE household_id = ? AND id != ?'
      ).run(now, householdId, locationId);
    }

    // Prevent leaving household with zero primary locations if unchecking the only primary location
    let nextPrimary = isPrimary;
    if (wasPrimary && !isPrimary) {
      const otherPrimary = db
        .prepare(
          'SELECT id FROM locations WHERE household_id = ? AND id != ? AND is_primary = 1 LIMIT 1'
        )
        .get(householdId, locationId);
      if (!otherPrimary) {
        const another = db
          .prepare('SELECT id, city, locality FROM locations WHERE household_id = ? AND id != ? ORDER BY created_at ASC LIMIT 1')
          .get(householdId, locationId) as { id: string; city: string; locality: string } | undefined;
        if (another) {
          db.prepare('UPDATE locations SET is_primary = 1, updated_at = ? WHERE id = ?').run(
            now,
            another.id
          );
          syncPrimaryLocationToHousehold(db, householdId, another.city, another.locality ?? '', now);
        } else {
          nextPrimary = true;
        }
      }
    }

    db.prepare(
      `UPDATE locations
       SET city = ?, locality = ?, label = ?, is_primary = ?, latitude = ?, longitude = ?, updated_at = ?
       WHERE id = ? AND household_id = ?`
    ).run(
      input.city,
      input.locality ?? '',
      input.label,
      nextPrimary ? 1 : 0,
      input.latitude ?? null,
      input.longitude ?? null,
      now,
      locationId,
      householdId
    );

    if (nextPrimary) {
      syncPrimaryLocationToHousehold(db, householdId, input.city, input.locality ?? '', now);
    }

    const updated = db
      .prepare('SELECT * FROM locations WHERE id = ? AND household_id = ?')
      .get(locationId, householdId) as Record<string, unknown>;
    return mapLocationRow(updated);
  });
}

export function deleteLocation(
  db: DatabaseSync,
  householdId: string,
  locationId: string
): boolean {
  return runInTransaction(db, () => {
    const existing = db
      .prepare('SELECT * FROM locations WHERE id = ? AND household_id = ?')
      .get(locationId, householdId) as Record<string, unknown> | undefined;
    if (!existing) return false;

    const wasPrimary = Number(existing.is_primary) === 1;
    db.prepare('DELETE FROM locations WHERE id = ? AND household_id = ?').run(
      locationId,
      householdId
    );

    if (wasPrimary) {
      const fallback = db
        .prepare('SELECT * FROM locations WHERE household_id = ? ORDER BY created_at ASC LIMIT 1')
        .get(householdId) as Record<string, unknown> | undefined;
      if (fallback) {
        const now = new Date().toISOString();
        db.prepare('UPDATE locations SET is_primary = 1, updated_at = ? WHERE id = ?').run(
          now,
          String(fallback.id)
        );
        syncPrimaryLocationToHousehold(
          db,
          householdId,
          String(fallback.city),
          String(fallback.locality ?? ''),
          now
        );
      }
    }

    return true;
  });
}

// ---------- User Settings ----------

export function getUserSettings(db: DatabaseSync, householdId: string): UserSettings {
  const row = db
    .prepare('SELECT * FROM user_settings WHERE household_id = ?')
    .get(householdId) as Record<string, unknown> | undefined;
  if (row) return mapUserSettingsRow(row);

  const hh = db
    .prepare('SELECT city, language FROM households WHERE id = ?')
    .get(householdId) as { city: string; language: string } | undefined;
  const now = new Date().toISOString();
  const lang = hh?.language === 'mr' || hh?.language === 'hi' ? hh.language : 'en';
  const defaultCity = hh?.city || 'Pune';

  db.prepare(
    `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
     VALUES (?, ?, 0, 0, ?, ?)`
  ).run(householdId, lang, defaultCity, now);

  return {
    householdId,
    language: lang,
    useDemoFixtures: false,
    simulateOutage: false,
    defaultCity,
    updatedAt: now,
  };
}

export function upsertUserSettings(
  db: DatabaseSync,
  householdId: string,
  input: UserSettingsInput
): UserSettings {
  return runInTransaction(db, () => {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(household_id) DO UPDATE SET
         language = excluded.language,
         use_demo_fixtures = excluded.use_demo_fixtures,
         simulate_outage = excluded.simulate_outage,
         default_city = excluded.default_city,
         updated_at = excluded.updated_at`
    ).run(
      householdId,
      input.language,
      input.useDemoFixtures ? 1 : 0,
      input.simulateOutage ? 1 : 0,
      input.defaultCity,
      now
    );

    db.prepare(
      'UPDATE households SET language = ?, city = ?, updated_at = ? WHERE id = ?'
    ).run(input.language, input.defaultCity, now, householdId);

    return getUserSettings(db, householdId);
  });
}

// ---------- Data Providers & Licenses ----------

export function listDataProvidersWithLicenses(db: DatabaseSync): DataProviderRecord[] {
  const providers = db
    .prepare('SELECT * FROM data_providers ORDER BY id ASC')
    .all() as Array<Record<string, unknown>>;
  const licenses = db
    .prepare('SELECT * FROM data_licenses ORDER BY id ASC')
    .all() as Array<Record<string, unknown>>;

  return providers.map((p) => {
    const id = String(p.id);
    return {
      id,
      name: String(p.name),
      baseUrl: String(p.base_url),
      requiresApiKey: Number(p.requires_api_key) === 1,
      status: String(p.status),
      notes: String(p.notes ?? ''),
      updatedAt: String(p.updated_at),
      licenses: licenses
        .filter((l) => String(l.provider_id) === id)
        .map((l) => ({
          id: String(l.id),
          providerId: String(l.provider_id),
          licenseName: String(l.license_name),
          attributionText: String(l.attribution_text),
          commercialAllowed: Number(l.commercial_allowed) === 1,
          attributionRequired: Number(l.attribution_required) === 1,
          licenseUrl: String(l.license_url ?? ''),
        })),
    };
  });
}

// ---------- Snapshots, Forecasts, Plans, Recommendations, Evidence, Scenarios ----------

function mapSnapshotRow(r: Record<string, unknown>): EnvironmentalSnapshot {
  const weatherParsed = safeJsonParse<EnvironmentalSnapshot['weather'] | undefined>(
    r.weather_json,
    undefined
  );
  const coordsParsed = safeJsonParse<EnvironmentalSnapshot['coordinates']>(
    r.coordinates_json,
    null
  );
  const qualityParsed = safeJsonParse<EnvironmentalSnapshot['qualityMetadata'] | undefined>(
    r.quality_json,
    undefined
  );

  return {
    id: String(r.id),
    provider: String(r.provider) as EnvironmentalSnapshot['provider'],
    providerLabel: String(r.provider_label),
    dataType: String(r.data_type) as EnvironmentalSnapshot['dataType'],
    classification: (r.classification
      ? String(r.classification)
      : undefined) as EnvironmentalSnapshot['classification'],
    city: String(r.city),
    locationLabel: String(r.location_label),
    stationOrGridId: String(r.station_or_grid_id),
    spatialResolutionNote: String(r.spatial_resolution_note),
    pollutants: JSON.parse(String(r.pollutants_json)),
    reportedAqiIndia: r.reported_aqi_india === null ? null : Number(r.reported_aqi_india),
    measuredAt: r.measured_at === null ? null : String(r.measured_at),
    retrievedAt: String(r.retrieved_at),
    freshness: String(r.freshness) as EnvironmentalSnapshot['freshness'],
    licenseAttribution: String(r.license_attribution),
    warnings: JSON.parse(String(r.warnings_json)),
    isDemoFixture: Number(r.is_demo_fixture) === 1,
    isAvailable: Number(r.is_available) === 1,
    coordinates: coordsParsed,
    weather:
      weatherParsed && Object.keys(weatherParsed).length > 0 ? weatherParsed : undefined,
    qualityMetadata:
      qualityParsed && Object.keys(qualityParsed).length > 0 ? qualityParsed : undefined,
  };
}

export function saveSnapshot(db: DatabaseSync, snap: EnvironmentalSnapshot): void {
  const classification = snap.classification ?? (snap.isDemoFixture ? 'demo_fixture' : snap.isAvailable ? 'verified_live' : 'unavailable');
  const weatherJson = JSON.stringify(snap.weather ?? {});
  const coordsJson = snap.coordinates ? JSON.stringify(snap.coordinates) : null;
  const qualityJson = JSON.stringify(snap.qualityMetadata ?? {});

  // Deduplicate repeated polls of identical provider/station/measurement timestamp
  if (snap.measuredAt && snap.provider !== 'unavailable') {
    const existing = db
      .prepare(
        `SELECT id FROM environmental_snapshots
         WHERE provider = ? AND station_or_grid_id = ? AND measured_at = ?
         LIMIT 1`
      )
      .get(snap.provider, snap.stationOrGridId, snap.measuredAt) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        `UPDATE environmental_snapshots
         SET retrieved_at = ?, freshness = ?, classification = ?, warnings_json = ?,
             weather_json = ?, coordinates_json = ?, quality_json = ?, is_available = ?
         WHERE id = ?`
      ).run(
        snap.retrievedAt,
        snap.freshness,
        classification,
        JSON.stringify(snap.warnings),
        weatherJson,
        coordsJson,
        qualityJson,
        snap.isAvailable ? 1 : 0,
        existing.id
      );
      return;
    }
  }

  db.prepare(
    `INSERT OR REPLACE INTO environmental_snapshots (
      id, provider, provider_label, data_type, classification, city, location_label, station_or_grid_id,
      spatial_resolution_note, pollutants_json, reported_aqi_india, measured_at, retrieved_at,
      freshness, license_attribution, warnings_json, is_demo_fixture, is_available,
      weather_json, coordinates_json, quality_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    snap.id,
    snap.provider,
    snap.providerLabel,
    snap.dataType,
    classification,
    snap.city,
    snap.locationLabel,
    snap.stationOrGridId,
    snap.spatialResolutionNote,
    JSON.stringify(snap.pollutants),
    snap.reportedAqiIndia ?? null,
    snap.measuredAt,
    snap.retrievedAt,
    snap.freshness,
    snap.licenseAttribution,
    JSON.stringify(snap.warnings),
    snap.isDemoFixture ? 1 : 0,
    snap.isAvailable ? 1 : 0,
    weatherJson,
    coordsJson,
    qualityJson
  );
}

export function listSnapshots(db: DatabaseSync, limit = 30): EnvironmentalSnapshot[] {
  const rows = db
    .prepare('SELECT * FROM environmental_snapshots ORDER BY retrieved_at DESC LIMIT ?')
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map(mapSnapshotRow);
}

export function listCitySnapshots(
  db: DatabaseSync,
  city: string,
  limit = 15
): EnvironmentalSnapshot[] {
  const rows = db
    .prepare(
      `SELECT * FROM environmental_snapshots
       WHERE lower(city) = lower(?) AND is_available = 1
       ORDER BY COALESCE(measured_at, retrieved_at) DESC
       LIMIT ?`
    )
    .all(city, limit) as Array<Record<string, unknown>>;

  return rows.map(mapSnapshotRow);
}

export function saveForecastSlots(db: DatabaseSync, city: string, slots: ForecastSlot[]): void {
  runInTransaction(db, () => {
    db.prepare('DELETE FROM cams_forecasts WHERE lower(city) = lower(?) AND is_demo_fixture = 0').run(
      city
    );
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO cams_forecasts (
        id, city, time_window, forecast_date, expected_pm25, expected_pm10, expected_aqi_india,
        trend, data_type, provider_label, grid_resolution_note, issued_at, license_attribution, is_demo_fixture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const s of slots) {
      stmt.run(
        s.id,
        s.city,
        s.timeWindow,
        s.forecastDate,
        s.expectedPm25,
        s.expectedPm10 ?? null,
        s.expectedAqiIndia,
        s.trend,
        s.dataType,
        s.providerLabel,
        s.gridResolutionNote,
        s.issuedAt,
        s.licenseAttribution,
        s.isDemoFixture ? 1 : 0
      );
    }
  });
}

export function listImportedForecasts(db: DatabaseSync, city?: string): ForecastSlot[] {
  const rows = (
    city
      ? db
          .prepare('SELECT * FROM cams_forecasts WHERE lower(city) = lower(?) ORDER BY time_window ASC')
          .all(city)
      : db.prepare('SELECT * FROM cams_forecasts ORDER BY city ASC, time_window ASC').all()
  ) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: String(r.id),
    city: String(r.city),
    timeWindow: String(r.time_window) as ForecastSlot['timeWindow'],
    forecastDate: String(r.forecast_date),
    expectedPm25: r.expected_pm25 === null ? null : Number(r.expected_pm25),
    expectedPm10: r.expected_pm10 === null ? null : Number(r.expected_pm10),
    expectedAqiIndia: r.expected_aqi_india === null ? null : Number(r.expected_aqi_india),
    trend: String(r.trend) as ForecastSlot['trend'],
    dataType: 'forecast',
    providerLabel: String(r.provider_label),
    gridResolutionNote: String(r.grid_resolution_note),
    issuedAt: String(r.issued_at),
    licenseAttribution: String(r.license_attribution),
    isDemoFixture: Number(r.is_demo_fixture) === 1,
  }));
}

export function savePlanHistory(
  db: DatabaseSync,
  householdId: string,
  plan: ProtectionPlanResult,
  primarySnapshotId?: string | null
): void {
  runInTransaction(db, () => {
    db.prepare(
      `INSERT OR REPLACE INTO protection_plans (id, household_id, city, generated_at, aqi_value, aqi_band, freshness, is_demo_fixture, rule_set_version, plan_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      plan.id,
      householdId,
      plan.city,
      plan.generatedAt,
      plan.aqiValue,
      plan.aqiBand,
      plan.freshness,
      plan.isDemoFixture ? 1 : 0,
      plan.ruleSetVersion ?? '2.0.0',
      JSON.stringify(plan)
    );

    db.prepare('DELETE FROM recommendations WHERE plan_id = ?').run(plan.id);
    const insertRec = db.prepare(
      `INSERT INTO recommendations (
        id, plan_id, household_id, rec_key, title_key, severity, confidence_key,
        applicable_members_json, source_timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < plan.recommendations.length; i++) {
      const rec = plan.recommendations[i];
      insertRec.run(
        `${plan.id}::${rec.id}::${i}`,
        plan.id,
        householdId,
        rec.id,
        rec.titleKey,
        rec.severity,
        rec.confidenceOrLimitationKey,
        JSON.stringify(rec.applicableMembers),
        rec.sourceTimestamp ?? null,
        plan.generatedAt
      );
    }

    db.prepare('DELETE FROM plan_evidence WHERE plan_id = ?').run(plan.id);
    let validSnapshotId: string | null = null;
    if (primarySnapshotId) {
      const snapExists = db
        .prepare('SELECT 1 FROM environmental_snapshots WHERE id = ?')
        .get(primarySnapshotId);
      if (snapExists) {
        validSnapshotId = primarySnapshotId;
      }
    }

    const ev = plan.supportingEvidence;
    db.prepare(
      `INSERT INTO plan_evidence (
        id, plan_id, snapshot_id, provider_label, station_or_grid_id, data_type,
        freshness, measured_at, retrieved_at, pm25, pm10, aqi_value, is_demo_fixture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `${plan.id}::ev-primary`,
      plan.id,
      validSnapshotId,
      ev.providerLabel,
      ev.stationOrGridId,
      ev.dataType,
      ev.freshness,
      ev.measuredAt,
      ev.retrievedAt,
      ev.pm25,
      ev.pm10,
      ev.aqiValue,
      ev.isDemoFixture ? 1 : 0
    );
  });
}

export function listPlanHistory(
  db: DatabaseSync,
  householdId: string,
  limit = 20
): ProtectionPlanResult[] {
  const rows = db
    .prepare(
      'SELECT plan_json FROM protection_plans WHERE household_id = ? ORDER BY generated_at DESC LIMIT ?'
    )
    .all(householdId, limit) as Array<{ plan_json: string }>;
  return rows.map((r) => JSON.parse(r.plan_json) as ProtectionPlanResult);
}

export function listPlanRecommendations(
  db: DatabaseSync,
  planId: string
): Array<{
  id: string;
  planId: string;
  householdId: string;
  recKey: string;
  titleKey: string;
  severity: string;
  confidenceKey: string;
  applicableMembers: string[];
  sourceTimestamp: string | null;
  createdAt: string;
}> {
  const rows = db
    .prepare('SELECT * FROM recommendations WHERE plan_id = ? ORDER BY id ASC')
    .all(planId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    planId: String(r.plan_id),
    householdId: String(r.household_id),
    recKey: String(r.rec_key),
    titleKey: String(r.title_key),
    severity: String(r.severity),
    confidenceKey: String(r.confidence_key),
    applicableMembers: JSON.parse(String(r.applicable_members_json)) as string[],
    sourceTimestamp: r.source_timestamp === null ? null : String(r.source_timestamp),
    createdAt: String(r.created_at),
  }));
}

export function listPlanEvidence(
  db: DatabaseSync,
  planId: string
): Array<{
  id: string;
  planId: string;
  snapshotId: string | null;
  providerLabel: string;
  stationOrGridId: string;
  dataType: string;
  freshness: string;
  measuredAt: string | null;
  retrievedAt: string;
  pm25: number | null;
  pm10: number | null;
  aqiValue: number | null;
  isDemoFixture: boolean;
}> {
  const rows = db
    .prepare('SELECT * FROM plan_evidence WHERE plan_id = ?')
    .all(planId) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    planId: String(r.plan_id),
    snapshotId: r.snapshot_id === null ? null : String(r.snapshot_id),
    providerLabel: String(r.provider_label),
    stationOrGridId: String(r.station_or_grid_id),
    dataType: String(r.data_type),
    freshness: String(r.freshness),
    measuredAt: r.measured_at === null ? null : String(r.measured_at),
    retrievedAt: String(r.retrieved_at),
    pm25: r.pm25 === null ? null : Number(r.pm25),
    pm10: r.pm10 === null ? null : Number(r.pm10),
    aqiValue: r.aqi_value === null ? null : Number(r.aqi_value),
    isDemoFixture: Number(r.is_demo_fixture) === 1,
  }));
}

export function saveScenarioRun(
  db: DatabaseSync,
  householdId: string,
  result: ScenarioComparisonResult
): void {
  db.prepare(
    `INSERT OR REPLACE INTO scenario_runs (id, household_id, created_at, label, result_json)
     VALUES (?, ?, ?, ?, ?)`
  ).run(result.id, householdId, result.createdAt, result.modification.label, JSON.stringify(result));
}

export function listScenarioRuns(
  db: DatabaseSync,
  householdId: string,
  limit = 20
): ScenarioComparisonResult[] {
  const rows = db
    .prepare(
      'SELECT result_json FROM scenario_runs WHERE household_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .all(householdId, limit) as Array<{ result_json: string }>;
  return rows.map((r) => JSON.parse(r.result_json) as ScenarioComparisonResult);
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
