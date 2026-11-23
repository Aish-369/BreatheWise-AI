import { ArrowRight, MapPin } from 'lucide-react';
import type { EnvironmentalSnapshot, LanguageCode } from '../../shared/types';
import { deriveAqiFromPollutants } from '../../engine/quality';
import { t } from '../../i18n/translations';
import { AqiGauge } from '../AqiGauge';

interface CityDetailCardProps {
  lang: LanguageCode;
  cityName: string;
  activeCity: string;
  snapshots: EnvironmentalSnapshot[];
  onSwitchHouseholdCity: (city: string) => Promise<void>;
}

export function CityDetailCard({
  lang,
  cityName,
  activeCity,
  snapshots,
  onSwitchHouseholdCity,
}: CityDetailCardProps) {
  const primary = snapshots[0];
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
            <span>
              {cityName === activeCity
                ? t(lang, 'ui_location_label')
                : t(lang, 'action_set_primary')}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!primary || !primary.isAvailable ? (
            <p className="text-xs text-[#525C56]">{t(lang, 'dash_unavailable_desc')}</p>
          ) : (
            <>
              <div className="flex items-center gap-5">
                <AqiGauge
                  aqi={derived?.aqi ?? null}
                  band={derived?.band ?? 'unavailable'}
                  bandLabel={
                    derived ? t(lang, `band_${derived.band}`) : t(lang, 'band_unavailable')
                  }
                  isAvailable={Boolean(derived?.aqi)}
                  size="sm"
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#252D28]">
                    {derived ? t(lang, `band_${derived.band}`) : t(lang, 'band_unavailable')}
                  </p>
                  <p className="text-xs text-[#565F58]">
                    {derived?.isDerived
                      ? t(lang, 'dash_derived_note')
                      : t(lang, 'dash_reported_note')}
                  </p>
                  <p className="text-xs font-medium text-[#263C32]">
                    {t(lang, `fresh_${primary.freshness}`)}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[#E2E7E1] border-t border-b border-[#E2E7E1] text-xs">
                {snapshots.map((s) => (
                  <div key={s.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#252D28]">{s.locationLabel}</span>
                      <span className="font-mono text-[#565F58]">
                        {t(lang, `fresh_${s.freshness}`)}
                      </span>
                    </div>
                    <p className="text-[#565F58]">
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
                <div className="space-y-1 text-xs text-[#565F58]">
                  <p className="font-semibold text-[#8E5312]">{t(lang, 'ui_alerts_title')}</p>
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
}
