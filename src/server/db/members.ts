import type { DatabaseSync } from 'node:sqlite';
import type { FamilyMember, FamilyMemberInput } from '../../shared/types';
import { runInTransaction, shortUuid } from './connection';
import { listRoutines } from './routines';

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
    input.id && input.id.trim().length > 0 ? input.id.trim() : `mem-${Date.now()}-${shortUuid()}`;
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

export function deleteMember(db: DatabaseSync, householdId: string, memberId: string): boolean {
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
