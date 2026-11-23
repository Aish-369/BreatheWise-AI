import type { DatabaseSync } from 'node:sqlite';
import type { ActivityRoutineInput, FamilyMemberInput } from '../../shared/types';

export function insertDemoMembers(db: DatabaseSync, householdId: string, now: string): void {
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

export function insertDemoRoutines(db: DatabaseSync, householdId: string, now: string): void {
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

export function insertDemoLocations(db: DatabaseSync, householdId: string, now: string): void {
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
