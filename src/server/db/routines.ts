import type { DatabaseSync } from 'node:sqlite';
import type { ActivityRoutine, ActivityRoutineInput } from '../../shared/types';
import { BadRequestError } from '../errors';
import { shortUuid } from './connection';

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
    completedDate:
      r.completed_date === null || r.completed_date === undefined ? null : String(r.completed_date),
    createdAt: String(r.created_at),
  };
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

export function deleteRoutine(db: DatabaseSync, householdId: string, routineId: string): boolean {
  const res = db
    .prepare('DELETE FROM activity_routines WHERE id = ? AND household_id = ?')
    .run(routineId, householdId);
  return Number(res.changes) > 0;
}
