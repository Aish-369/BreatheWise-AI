import type { DatabaseSync } from 'node:sqlite';
import type { DataProviderRecord, UserSettings, UserSettingsInput } from '../../shared/types';
import { runInTransaction } from './connection';

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

export function getUserSettings(db: DatabaseSync, householdId: string): UserSettings {
  const row = db.prepare('SELECT * FROM user_settings WHERE household_id = ?').get(householdId) as
    Record<string, unknown> | undefined;
  if (row) return mapUserSettingsRow(row);

  const hh = db.prepare('SELECT city, language FROM households WHERE id = ?').get(householdId) as
    { city: string; language: string } | undefined;
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

    db.prepare('UPDATE households SET language = ?, city = ?, updated_at = ? WHERE id = ?').run(
      input.language,
      input.defaultCity,
      now,
      householdId
    );

    return getUserSettings(db, householdId);
  });
}

export function listDataProvidersWithLicenses(db: DatabaseSync): DataProviderRecord[] {
  const providers = db.prepare('SELECT * FROM data_providers ORDER BY id ASC').all() as Array<
    Record<string, unknown>
  >;
  const licenses = db.prepare('SELECT * FROM data_licenses ORDER BY id ASC').all() as Array<
    Record<string, unknown>
  >;

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
