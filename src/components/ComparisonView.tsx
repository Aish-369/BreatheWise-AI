import { motion } from 'motion/react';
import { ArrowRight, MapPin } from 'lucide-react';
import type { EnvironmentalSnapshot, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';
import { deriveAqiFromPollutants } from '../engine/quality';
import { AqiGauge } from './AqiGauge';

interface ComparisonViewProps {
  lang: LanguageCode;
  puneSnapshots: EnvironmentalSnapshot[];
  ahilyanagarSnapshots: EnvironmentalSnapshot[];
  onSwitchHouseholdCity: (city: string) => Promise<void>;
}

export function ComparisonView({
  lang,
  puneSnapshots,
  ahilyanagarSnapshots,
  onSwitchHouseholdCity,
}: ComparisonViewProps) {
  const punePrimary = puneSnapshots[0];
  const ahPrimary = ahilyanagarSnapshots[0];

  const comparisonMetrics = [
    { label: 'PM2.5 (µg/m³)', pune: punePrimary?.pollutants.pm25, ah: ahPrimary?.pollutants.pm25, max: 140 },
    { label: 'PM10 (µg/m³)', pune: punePrimary?.pollutants.pm10, ah: ahPrimary?.pollutants.pm10, max: 200 },
    { label: 'NO2 (µg/m³)', pune: punePrimary?.pollutants.no2, ah: ahPrimary?.pollutants.no2, max: 100 },
    { label: 'O3 (µg/m³)', pune: punePrimary?.pollutants.o3, ah: ahPrimary?.pollutants.o3, max: 100 },
  ];

  const renderCityCard = (cityName: string, snaps: EnvironmentalSnapshot[]) => {
    const primary = snaps[0];
    const derived = primary
      ? deriveAqiFromPollutants(primary.pollutants, primary.reportedAqiIndia)
      : null;

    return (
      <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
        <div>
          <div className="px-6 py-5 bg-gradient-to-r from-[#263C32] to-[#2F4A3D] text-white flex items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1 text-xs text-[#DCE9DD]">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location Reference</span>
              </p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-white">{cityName}</h2>
            </div>
            <button
              type="button"
              onClick={() => onSwitchHouseholdCity(cityName)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white text-[#263C32] rounded-lg hover:bg-[#DCE9DD] transition-colors cursor-pointer"
            >
              <span>Set Active City</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {!primary || !primary.isAvailable ? (
              <p className="text-xs text-[#89918A]">
                No station or bulletin coverage available for {cityName}.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-5">
                  <AqiGauge
                    aqi={derived?.aqi ?? null}
                    band={derived?.band ?? 'unavailable'}
                    bandLabel={derived ? t(lang, `band_${derived.band}`) : 'Unavailable'}
                    isAvailable={Boolean(derived?.aqi)}
                    size="sm"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#252D28]">
                      {derived ? t(lang, `band_${derived.band}`) : 'Unavailable'}
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
                        PM2.5 {s.pollutants.pm25 ?? 'Missing'} · PM10 {s.pollutants.pm10 ?? 'Missing'} · NO2{' '}
                        {s.pollutants.no2 ?? 'Missing'} · O3 {s.pollutants.o3 ?? 'Missing'}
                      </p>
                    </div>
                  ))}
                </div>

                {primary.warnings.length > 0 && (
                  <div className="space-y-1 text-xs text-[#89918A]">
                    <p className="font-semibold text-[#B4691E]">Coverage & Quality Notes</p>
                    {primary.warnings.map((w, i) => (
                      <p key={i}>• {w}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 bg-[#F7F7F1] border-t border-[#E2E7E1] text-xs text-[#89918A]">
          {cityName === 'Ahilyanagar'
            ? 'Regional limitation: sparser pollutant coverage and no forecast loaded; missing gases are never interpolated.'
            : 'Pune includes two comparison fixtures (Shivajinagar vs. Pashan) showing intra-city variation.'}
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

      {/* Overlay Comparison Chart */}
      <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            Side-by-Side Pollutant & Coverage Matrix
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#89918A]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#263C32]" /> Pune
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#829C83]" /> Ahilyanagar
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparisonMetrics.map((m) => (
            <div key={m.label} className="p-3.5 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#252D28]">
                <span>{m.label}</span>
                <span className="font-mono tabular-nums text-[#89918A]">
                  {m.pune ?? '—'} vs {m.ah ?? 'Missing'}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  {typeof m.pune === 'number' && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(1, m.pune / m.max) }}
                      transition={{ duration: 0.45 }}
                      style={{ originX: 0 }}
                      className="h-full rounded-full bg-[#263C32]"
                    />
                  )}
                </div>
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  {typeof m.ah === 'number' ? (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: Math.min(1, m.ah / m.max) }}
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
        {renderCityCard('Pune', puneSnapshots)}
        {renderCityCard('Ahilyanagar', ahilyanagarSnapshots)}
      </div>
    </div>
  );
}
