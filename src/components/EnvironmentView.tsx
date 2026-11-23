import { useState } from 'react';
import type {
  AqiBand,
  EnvironmentalSnapshot,
  ForecastSlot,
  LanguageCode,
  ProviderAdapterStatus,
} from '../shared/types';
import { t } from '../i18n/translations';
import { IndoorGuidanceView } from './IndoorGuidanceView';
import { DataAvailabilityBanner } from './environment/DataAvailabilityBanner';
import { CamsForecastTab } from './environment/CamsForecastTab';
import { TelemetryStationTab } from './environment/TelemetryStationTab';

interface EnvironmentViewProps {
  lang: LanguageCode;
  city: string;
  currentBand: AqiBand;
  primarySnapshot: EnvironmentalSnapshot;
  secondarySnapshots: EnvironmentalSnapshot[];
  forecasts: ForecastSlot[];
  providerStatuses: ProviderAdapterStatus[];
  initialSubTab?: 'telemetry' | 'indoor' | 'forecast';
  onImportCams: (rawText: string) => Promise<{ ok: boolean; message: string }>;
}

export function EnvironmentView({
  lang,
  city,
  currentBand,
  primarySnapshot,
  secondarySnapshots,
  forecasts,
  providerStatuses,
  initialSubTab = 'telemetry',
  onImportCams,
}: EnvironmentViewProps) {
  const [subTab, setSubTab] = useState<'telemetry' | 'indoor' | 'forecast'>(initialSubTab);

  const availableSnapshots = [primarySnapshot, ...secondarySnapshots].filter(
    (snapshot) => snapshot.isAvailable
  );
  const hasStationObservation = availableSnapshots.some(
    (snapshot) =>
      snapshot.dataType === 'physical_station' && snapshot.classification !== 'demo_fixture'
  );
  const nextForecast =
    forecasts.find(
      (slot) => typeof slot.expectedPm25 === 'number' || typeof slot.expectedPm10 === 'number'
    ) ?? null;

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'env_title')}</h1>
          <p className="mt-1 text-sm text-[#565F58]">{t(lang, 'env_subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
          {(['telemetry', 'forecast', 'indoor'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subTab === tab ? 'bg-[#263C32] text-white' : 'text-[#565F58] hover:text-[#252D28]'
              }`}
            >
              {tab === 'telemetry'
                ? t(lang, 'tab_telemetry')
                : tab === 'forecast'
                  ? t(lang, 'tab_forecast')
                  : t(lang, 'tab_indoor')}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'telemetry' && (
        <DataAvailabilityBanner
          city={city}
          hasStationObservation={hasStationObservation}
          nextForecast={nextForecast}
          onViewForecast={() => setSubTab('forecast')}
        />
      )}

      {subTab === 'indoor' ? (
        <IndoorGuidanceView lang={lang} currentBand={currentBand} city={city} />
      ) : subTab === 'forecast' ? (
        <CamsForecastTab
          lang={lang}
          city={city}
          forecasts={forecasts}
          onImportCams={onImportCams}
        />
      ) : (
        <TelemetryStationTab
          lang={lang}
          city={city}
          availableSnapshots={availableSnapshots}
          providerStatuses={providerStatuses}
        />
      )}
    </div>
  );
}
