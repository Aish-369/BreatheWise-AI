import type { DatabaseSync } from 'node:sqlite';
import type { ProtectionPlanResult, ScenarioComparisonResult } from '../../shared/types';
import { runInTransaction } from './connection';

function insertPlanRecommendations(
  db: DatabaseSync,
  householdId: string,
  plan: ProtectionPlanResult
): void {
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
}

function insertPlanEvidence(
  db: DatabaseSync,
  plan: ProtectionPlanResult,
  primarySnapshotId?: string | null
): void {
  db.prepare('DELETE FROM plan_evidence WHERE plan_id = ?').run(plan.id);
  let validSnapshotId: string | null = null;
  if (primarySnapshotId) {
    const snapExists = db
      .prepare('SELECT 1 FROM environmental_snapshots WHERE id = ?')
      .get(primarySnapshotId);
    if (snapExists) validSnapshotId = primarySnapshotId;
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
    insertPlanRecommendations(db, householdId, plan);
    insertPlanEvidence(db, plan, primarySnapshotId);
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
  const rows = db.prepare('SELECT * FROM plan_evidence WHERE plan_id = ?').all(planId) as Array<
    Record<string, unknown>
  >;
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
  ).run(
    result.id,
    householdId,
    result.createdAt,
    result.modification.label,
    JSON.stringify(result)
  );
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
