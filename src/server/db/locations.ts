import type { DatabaseSync } from 'node:sqlite';
import type { LocationInput, SavedLocation } from '../../shared/types';
import { runInTransaction, shortUuid } from './connection';

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

function syncPrimaryLocationToHousehold(
  db: DatabaseSync,
  householdId: string,
  city: string,
  locality: string,
  now: string
): void {
  db.prepare('UPDATE households SET city = ?, locality = ?, updated_at = ? WHERE id = ?').run(
    city,
    locality,
    now,
    householdId
  );
  db.prepare(
    `INSERT INTO user_settings (household_id, language, use_demo_fixtures, simulate_outage, default_city, updated_at)
     VALUES (?, (SELECT language FROM households WHERE id = ?), 1, 0, ?, ?)
     ON CONFLICT(household_id) DO UPDATE SET
       default_city = excluded.default_city,
       updated_at = excluded.updated_at`
  ).run(householdId, householdId, city, now);
}

function resolveNextPrimaryFlag(
  db: DatabaseSync,
  householdId: string,
  locationId: string,
  wasPrimary: boolean,
  isPrimary: boolean,
  now: string
): boolean {
  if (isPrimary) {
    db.prepare(
      'UPDATE locations SET is_primary = 0, updated_at = ? WHERE household_id = ? AND id != ?'
    ).run(now, householdId, locationId);
    return true;
  }
  if (!wasPrimary) return false;
  const otherPrimary = db
    .prepare(
      'SELECT id FROM locations WHERE household_id = ? AND id != ? AND is_primary = 1 LIMIT 1'
    )
    .get(householdId, locationId);
  if (otherPrimary) return false;

  const another = db
    .prepare(
      'SELECT id, city, locality FROM locations WHERE household_id = ? AND id != ? ORDER BY created_at ASC LIMIT 1'
    )
    .get(householdId, locationId) as { id: string; city: string; locality: string } | undefined;
  if (!another) return true;

  db.prepare('UPDATE locations SET is_primary = 1, updated_at = ? WHERE id = ?').run(
    now,
    another.id
  );
  syncPrimaryLocationToHousehold(db, householdId, another.city, another.locality ?? '', now);
  return false;
}

export function listLocations(db: DatabaseSync, householdId: string): SavedLocation[] {
  const rows = db
    .prepare(
      'SELECT * FROM locations WHERE household_id = ? ORDER BY is_primary DESC, created_at ASC'
    )
    .all(householdId) as Array<Record<string, unknown>>;
  return rows.map(mapLocationRow);
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
    const nextPrimary = resolveNextPrimaryFlag(
      db,
      householdId,
      locationId,
      Number(existing.is_primary) === 1,
      Boolean(input.isPrimary),
      now
    );

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

export function deleteLocation(db: DatabaseSync, householdId: string, locationId: string): boolean {
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
