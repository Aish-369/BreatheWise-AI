import { useMemo, useState } from 'react';
import type {
  EnvironmentalSnapshot,
  LanguageCode,
  LocationInput,
  SavedLocation,
} from '../shared/types';
import { t } from '../i18n/translations';
import { SavedLocationsPanel } from './comparison/SavedLocationsPanel';
import { CityComparisonPanel } from './comparison/CityComparisonPanel';
import { CityDetailCard } from './comparison/CityDetailCard';

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
    const map: Record<string, EnvironmentalSnapshot[]> = { ...(byCitySnapshots ?? {}) };
    if (!map['Pune']) map['Pune'] = puneSnapshots;
    if (!map['Ahilyanagar']) map['Ahilyanagar'] = ahilyanagarSnapshots;
    for (const loc of locations) {
      if (!map[loc.city]) map[loc.city] = [];
    }
    return map;
  }, [byCitySnapshots, puneSnapshots, ahilyanagarSnapshots, locations]);

  const availableCities = useMemo(() => Object.keys(citySnapshotMap), [citySnapshotMap]);
  const [slotA, setSlotA] = useState<string>(availableCities[0] ?? 'Pune');
  const [slotB, setSlotB] = useState<string>(
    availableCities[1] ?? availableCities[0] ?? 'Ahilyanagar'
  );

  const snapsA = citySnapshotMap[slotA] ?? [];
  const snapsB = citySnapshotMap[slotB] ?? [];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'comp_title')}</h1>
        <p className="mt-1 text-sm text-[#565F58]">{t(lang, 'comp_subtitle')}</p>
      </div>

      <SavedLocationsPanel
        lang={lang}
        locations={locations}
        onCreateLocation={onCreateLocation}
        onUpdateLocation={onUpdateLocation}
        onDeleteLocation={onDeleteLocation}
      />

      <CityComparisonPanel
        lang={lang}
        availableCities={availableCities}
        slotA={slotA}
        slotB={slotB}
        primaryA={snapsA[0] ?? null}
        primaryB={snapsB[0] ?? null}
        onChangeSlotA={setSlotA}
        onChangeSlotB={setSlotB}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <CityDetailCard
          lang={lang}
          cityName={slotA}
          activeCity={activeCity}
          snapshots={snapsA}
          onSwitchHouseholdCity={onSwitchHouseholdCity}
        />
        <CityDetailCard
          lang={lang}
          cityName={slotB}
          activeCity={activeCity}
          snapshots={snapsB}
          onSwitchHouseholdCity={onSwitchHouseholdCity}
        />
      </div>
    </div>
  );
}
