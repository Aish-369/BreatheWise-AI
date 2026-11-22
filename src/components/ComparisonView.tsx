import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type {
  EnvironmentalSnapshot,
  LanguageCode,
  LocationInput,
  SavedLocation,
} from '../shared/types';
import { findCityMetadata, searchIndianCities } from '../shared/indianCities';
import { t } from '../i18n/translations';
import {
  assessLocationComparisonCompatibility,
  deriveAqiFromPollutants,
} from '../engine/quality';
import { AqiGauge } from './AqiGauge';

interface ComparisonViewProps {
  lang: LanguageCode;
  activeCity: string;
  locations: SavedLocation[];
  puneSnapshots: EnvironmentalSnapshot[];
  ahilyanagarSnapshots: EnvironmentalSnapshot[];
  byCitySnapshots?: Record<string, EnvironmentalSnapshot[]>;
  onSwitchHouseholdCity: (city: string) => Promise<void>;
  onCreateLocation: (input: LocationInput) => Promise<void>;
  onUpdateLocation: (id: string, input: LocationInput) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
}

export function ComparisonView({
  lang,
  activeCity,
  locations,
  puneSnapshots,
  ahilyanagarSnapshots,
  byCitySnapshots,
  onSwitchHouseholdCity,
  onCreateLocation,
  onUpdateLocation,
  onDeleteLocation,
}: ComparisonViewProps) {
  const citySnapshotMap = useMemo(() => {
    const map: Record<string, EnvironmentalSnapshot[]> = {
      ...(byCitySnapshots ?? {}),
    };
    if (!map['Pune']) map['Pune'] = puneSnapshots;
    if (!map['Ahilyanagar']) map['Ahilyanagar'] = ahilyanagarSnapshots;
    for (const loc of locations) {
      if (!map[loc.city]) map[loc.city] = [];
    }
    return map;
  }, [byCitySnapshots, puneSnapshots, ahilyanagarSnapshots, locations]);

  const availableCities = useMemo(() => Object.keys(citySnapshotMap), [citySnapshotMap]);
  const [slotA, setSlotA] = useState<string>(availableCities[0] ?? 'Pune');
  const [slotB, setSlotB] = useState<string>(availableCities[1] ?? availableCities[0] ?? 'Ahilyanagar');

  const [cityQuery, setCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [locLabel, setLocLabel] = useState('');
  const [locality, setLocality] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editLocality, setEditLocality] = useState('');

  const matchedCities = searchIndianCities(cityQuery);
  const selectedCityMeta = findCityMetadata(selectedCity);

  const snapsA = citySnapshotMap[slotA] ?? [];
  const snapsB = citySnapshotMap[slotB] ?? [];
  const primaryA = snapsA[0] ?? null;
  const primaryB = snapsB[0] ?? null;

  const compatibility = assessLocationComparisonCompatibility(primaryA, primaryB);

  const comparisonMetrics = [
    { label: 'PM2.5 (µg/m³)', valA: primaryA?.pollutants.pm25, valB: primaryB?.pollutants.pm25, max: 140 },
    { label: 'PM10 (µg/m³)', valA: primaryA?.pollutants.pm10, valB: primaryB?.pollutants.pm10, max: 200 },
    { label: 'NO2 (µg/m³)', valA: primaryA?.pollutants.no2, valB: primaryB?.pollutants.no2, max: 100 },
    { label: 'O3 (µg/m³)', valA: primaryA?.pollutants.o3, valB: primaryB?.pollutants.o3, max: 100 },
  ];

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity.trim()) return;
    setSavingLoc(true);
    try {
      const meta = findCityMetadata(selectedCity);
      await onCreateLocation({
        city: selectedCity.trim(),
        locality: locality.trim(),
        label: locLabel.trim() || selectedCity.trim(),
        isPrimary,
        latitude: meta?.latitude ?? null,
        longitude: meta?.longitude ?? null,
      });
      setLocLabel('');
      setLocality('');
      setIsPrimary(false);
    } finally {
      setSavingLoc(false);
    }
  };

  const handleSaveEditLocation = async (loc: SavedLocation) => {
    setSavingLoc(true);
    try {
      await onUpdateLocation(loc.id, {
        city: loc.city,
        locality: editLocality.trim(),
        label: editLabel.trim() || loc.label,
        isPrimary: loc.isPrimary,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setEditingId(null);
    } finally {
      setSavingLoc(false);
    }
  };

  const renderCityCard = (cityName: string, snaps: EnvironmentalSnapshot[]) => {
    const primary = snaps[0];
    const derived = primary
      ? deriveAqiFromPollutants(primary.pollutants, primary.reportedAqiIndia)
      : null;
    const classKey = `cls_${primary?.classification ?? (primary?.isDemoFixture ? 'demo_fixture' : primary?.isAvailable ? 'verified_live' : 'unavailable')}`;

    return (
      <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
        <div>
          <div className="px-6 py-5 bg-gradient-to-r from-[#263C32] to-[#2F4A3D] text-white flex items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs text-[#DCE9DD]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t(lang, classKey)}</span>
              </p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-white">{cityName}</h2>
            </div>
            <button
              type="button"
              onClick={() => void onSwitchHouseholdCity(cityName)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white text-[#263C32] rounded-lg hover:bg-[#DCE9DD] transition-colors cursor-pointer"
            >
              <span>{cityName === activeCity ? t(lang, 'ui_location_label') : t(lang, 'action_set_primary')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {!primary || !primary.isAvailable ? (
              <p className="text-xs text-[#89918A]">
                {t(lang, 'dash_unavailable_desc')}
              </p>
            ) : (
              <>
                <div className="flex items-center gap-5">
                  <AqiGauge
                    aqi={derived?.aqi ?? null}
                    band={derived?.band ?? 'unavailable'}
                    bandLabel={derived ? t(lang, `band_${derived.band}`) : t(lang, 'band_unavailable')}
                    isAvailable={Boolean(derived?.aqi)}
                    size="sm"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#252D28]">
                      {derived ? t(lang, `band_${derived.band}`) : t(lang, 'band_unavailable')}
                    </p>
                    <p className="text-xs text-[#89918A]">
                      {derived?.isDerived ? t(lang, 'dash_derived_note') : t(lang, 'dash_reported_note')}
                    </p>
                    <p className="text-xs font-medium text-[#263C32]">
                      {t(lang, `fresh_${primary.freshness}`)}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#E2E7E1] border-t border-b border-[#E2E7E1] text-xs">
                  {snaps.map((s) => (
                    <div key={s.id} className="py-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#252D28]">{s.locationLabel}</span>
                        <span className="font-mono text-[#89918A]">
                          {t(lang, `fresh_${s.freshness}`)}
                        </span>
                      </div>
                      <p className="text-[#89918A]">
                        {s.providerLabel} · {t(lang, `dtype_${s.dataType}`)}
                      </p>
                      <p className="font-mono tabular-nums text-[#252D28]">
                        PM2.5 {s.pollutants.pm25 ?? '—'} · PM10 {s.pollutants.pm10 ?? '—'} · NO2{' '}
                        {s.pollutants.no2 ?? '—'} · O3 {s.pollutants.o3 ?? '—'}
                      </p>
                    </div>
                  ))}
                </div>

                {primary.warnings.length > 0 && (
                  <div className="space-y-1 text-xs text-[#89918A]">
                    <p className="font-semibold text-[#B4691E]">{t(lang, 'ui_alerts_title')}</p>
                    {primary.warnings.map((w, i) => (
                      <p key={i}>• {w}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'comp_title')}</h1>
        <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'comp_subtitle')}</p>
      </div>

      {/* Saved Household Locations CRUD Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              {t(lang, 'ui_saved_locations_title')} ({locations.length})
            </h2>
          </div>
          <div className="space-y-2.5">
            {locations.map((loc) => {
              const isEditing = editingId === loc.id;
              return (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {isEditing ? (
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-[#E2E7E1] rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={editLocality}
                        onChange={(e) => setEditLocality(e.target.value)}
                        placeholder={t(lang, 'ui_locality_optional')}
                        className="px-2.5 py-1.5 bg-white border border-[#E2E7E1] rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        disabled={savingLoc}
                        onClick={() => void handleSaveEditLocation(loc)}
                        className="px-3 py-1.5 bg-[#263C32] text-white rounded-lg cursor-pointer"
                      >
                        {t(lang, 'action_save_edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label={t(lang, 'action_close')}
                        className="p-1.5 text-[#89918A] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-[#252D28] flex items-center gap-1.5">
                          <span>{loc.label}</span>
                          {loc.isPrimary && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#263C32] text-white text-[10px]">
                              <Star className="w-2.5 h-2.5" /> Primary
                            </span>
                          )}
                        </p>
                        <p className="text-[#89918A]">
                          {loc.city}
                          {loc.locality ? ` · ${loc.locality}` : ''}
                          {loc.latitude !== null && loc.longitude !== null
                            ? ` · (${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)})`
                            : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!loc.isPrimary && (
                          <button
                            type="button"
                            onClick={() =>
                              void onUpdateLocation(loc.id, {
                                city: loc.city,
                                locality: loc.locality,
                                label: loc.label,
                                isPrimary: true,
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                              })
                            }
                            className="px-2.5 py-1 rounded-md border border-[#E2E7E1] bg-white text-[#263C32] hover:bg-[#DCE9DD]/45 cursor-pointer"
                          >
                            {t(lang, 'action_set_primary')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(loc.id);
                            setEditLabel(loc.label);
                            setEditLocality(loc.locality);
                          }}
                          aria-label={`${t(lang, 'action_edit')} ${loc.label}`}
                          className="p-1.5 rounded-lg text-[#89918A] hover:text-[#263C32] hover:bg-white cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => void onDeleteLocation(loc.id)}
                            aria-label={`${t(lang, 'action_delete')} ${loc.label}`}
                            className="p-1.5 rounded-lg text-[#89918A] hover:text-[#B33A2E] hover:bg-white cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleAddLocation}
          className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-3.5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
        >
          <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#829C83]" />
            <span>{t(lang, 'ui_add_location_title')}</span>
          </h2>
          <div>
            <input
              type="text"
              aria-label={t(lang, 'ui_search_city_placeholder')}
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder={t(lang, 'ui_search_city_placeholder')}
              className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg mb-2"
            />
            <select
              aria-label={t(lang, 'ui_location_label')}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
            >
              {matchedCities.map((c) => (
                <option key={c.canonicalName} value={c.canonicalName}>
                  {c.canonicalName} ({c.state})
                </option>
              ))}
            </select>
            {selectedCityMeta?.disambiguationNote && (
              <p className="mt-1 text-[11px] text-[#89918A]">
                {selectedCityMeta.disambiguationNote}
              </p>
            )}
          </div>
          <input
            type="text"
            aria-label={t(lang, 'ui_location_label_input')}
            value={locLabel}
            onChange={(e) => setLocLabel(e.target.value)}
            placeholder={t(lang, 'ui_location_label_input')}
            className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          />
          <input
            type="text"
            aria-label={t(lang, 'ui_locality_optional')}
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder={t(lang, 'ui_locality_optional')}
            className="w-full px-3 py-2 text-xs bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
          />
          <label className="flex items-center gap-2 text-xs text-[#252D28] cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="accent-[#263C32]"
            />
            <span>{t(lang, 'action_set_primary')}</span>
          </label>
          <button
            type="submit"
            disabled={savingLoc}
            className="w-full py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
          >
            {t(lang, 'action_add')}
          </button>
        </form>
      </div>

      {/* Comparison Selectors & Compatibility Check */}
      <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-2 font-medium text-[#252D28]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#263C32]" />
              <span>{t(lang, 'ui_compare_slot_a')}:</span>
              <select
                value={slotA}
                onChange={(e) => setSlotA(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg font-medium"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="inline-flex items-center gap-2 font-medium text-[#252D28]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#829C83]" />
              <span>{t(lang, 'ui_compare_slot_b')}:</span>
              <select
                value={slotB}
                onChange={(e) => setSlotB(e.target.value)}
                className="px-2.5 py-1.5 bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg font-medium"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Compatibility Banner */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            compatibility.compatible
              ? 'border-[#829C83]/45 bg-[#DCE9DD]/35 text-[#263C32]'
              : 'border-[#B4691E]/35 bg-[#F5EBD8]/45 text-[#8E5312]'
          }`}
        >
          {compatibility.compatible ? (
            <CheckCircle2 className="w-4 h-4 text-[#3B6E52] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#B4691E] shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              {compatibility.compatible
                ? t(lang, 'ui_compatibility_ok')
                : t(lang, 'ui_compatibility_warn')}
            </p>
            {compatibility.warningKeys.map((wk) => (
              <p key={wk}>• {t(lang, wk)}</p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparisonMetrics.map((m) => (
            <div key={m.label} className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#252D28]">
                <span>{m.label}</span>
                <span className="font-mono tabular-nums text-[#89918A]">
                  {m.valA ?? '—'} vs {m.valB ?? t(lang, 'ui_not_reported')}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  {typeof m.valA === 'number' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(1, m.valA / m.max) }}
                      transition={{ duration: 0.45 }}
                      style={{ originX: 0 }}
                      className="h-full rounded-full bg-[#263C32]"
                    />
                  )}
                </div>
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  {typeof m.valB === 'number' ? (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(1, m.valB / m.max) }}
                      transition={{ duration: 0.45 }}
                      style={{ originX: 0 }}
                      className="h-full rounded-full bg-[#829C83]"
                    />
                  ) : (
                    <div className="h-full w-full border border-dashed border-[#E2E7E1] rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {renderCityCard(slotA, snapsA)}
        {renderCityCard(slotB, snapsB)}
      </div>
    </div>
  );
}
