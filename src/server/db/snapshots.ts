import type { DatabaseSync } from 'node:sqlite';
import type { EnvironmentalSnapshot, ForecastSlot } from '../../shared/types';
import { runInTransaction, safeJsonParse } from './connection';

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
    weather: weatherParsed && Object.keys(weatherParsed).length > 0 ? weatherParsed : undefined,
    qualityMetadata:
      qualityParsed && Object.keys(qualityParsed).length > 0 ? qualityParsed : undefined,
  };
}

export function saveSnapshot(db: DatabaseSync, snap: EnvironmentalSnapshot): void {
  const classification =
    snap.classification ??
    (snap.isDemoFixture ? 'demo_fixture' : snap.isAvailable ? 'verified_live' : 'unavailable');
  const weatherJson = JSON.stringify(snap.weather ?? {});
  const coordsJson = snap.coordinates ? JSON.stringify(snap.coordinates) : null;
  const qualityJson = JSON.stringify(snap.qualityMetadata ?? {});

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

export function saveForecastSlots(
  db: DatabaseSync,
  city: string,
  slots: ForecastSlot[],
  householdId?: string
): void {
  runInTransaction(db, () => {
    db.prepare(
      'DELETE FROM cams_forecasts WHERE lower(city) = lower(?) AND is_demo_fixture = 0 AND household_id IS ?'
    ).run(city, householdId ?? null);
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO cams_forecasts (
        id, city, time_window, forecast_date, expected_pm25, expected_pm10, expected_aqi_india,
        trend, data_type, provider_label, grid_resolution_note, issued_at, license_attribution, is_demo_fixture, household_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        s.isDemoFixture ? 1 : 0,
        householdId ?? null
      );
    }
  });
}

export function listImportedForecasts(
  db: DatabaseSync,
  city?: string,
  householdId?: string
): ForecastSlot[] {
  const scope = householdId ? ' AND (household_id IS NULL OR household_id = ?)' : '';
  const rows = (
    city
      ? db
          .prepare(
            `SELECT * FROM cams_forecasts WHERE lower(city) = lower(?)${scope} ORDER BY time_window ASC`
          )
          .all(...(householdId ? [city, householdId] : [city]))
      : db
          .prepare(
            `SELECT * FROM cams_forecasts WHERE 1 = 1${scope} ORDER BY city ASC, time_window ASC`
          )
          .all(...(householdId ? [householdId] : []))
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
