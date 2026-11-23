import { motion } from 'motion/react';
import { CloudSun, MapPin } from 'lucide-react';
import type { EnvironmentalSnapshot, LanguageCode } from '../../shared/types';
import { deriveAqiFromPollutants } from '../../engine/quality';
import { t } from '../../i18n/translations';

interface StationSnapshotCardProps {
  lang: LanguageCode;
  snapshot: EnvironmentalSnapshot;
}

export function StationSnapshotCard({ lang, snapshot: s }: StationSnapshotCardProps) {
  const derived = deriveAqiFromPollutants(s.pollutants, s.reportedAqiIndia);
  const barPct = derived.aqi ? Math.min(100, Math.round((derived.aqi / 300) * 100)) : 0;
  const classKey = `cls_${s.classification ?? (s.isDemoFixture ? 'demo_fixture' : s.isAvailable ? 'verified_live' : 'unavailable')}`;

  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl p-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)] space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-[#DCE9DD]/65 text-[10px] font-semibold text-[#263C32]">
              {t(lang, classKey)}
            </span>
            {s.qualityMetadata?.fromCache && (
              <span className="px-2 py-0.5 rounded bg-[#F7F7F1] border border-[#E2E7E1] text-[10px] font-mono text-[#565F58]">
                {t(lang, 'ui_cached_badge')}
              </span>
            )}
          </div>
          <h2 className="mt-1.5 font-display text-base font-semibold text-[#252D28]">
            {s.providerLabel}
          </h2>
          <p className="font-mono text-[11px] text-[#565F58]">
            {s.locationLabel} · {t(lang, `dtype_${s.dataType}`)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="font-display text-2xl font-bold text-[#263C32] tabular-nums">
            {derived.aqi ?? '—'}
          </span>
          <p className="text-[11px] text-[#565F58]">{t(lang, `fresh_${s.freshness}`)}</p>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-[#F7F7F1] overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0.05, barPct / 100) }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ originX: 0 }}
          className="h-full rounded-full bg-gradient-to-r from-[#829C83] to-[#263C32]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E7E1] text-xs font-mono tabular-nums">
        <div>
          <span className="block text-[10px] text-[#565F58]">PM2.5</span>
          <span className="font-medium text-[#252D28]">{s.pollutants.pm25 ?? '—'} µg/m³</span>
        </div>
        <div>
          <span className="block text-[10px] text-[#565F58]">PM10</span>
          <span className="font-medium text-[#252D28]">{s.pollutants.pm10 ?? '—'} µg/m³</span>
        </div>
        <div>
          <span className="block text-[10px] text-[#565F58]">NO2</span>
          <span className="font-medium text-[#252D28]">{s.pollutants.no2 ?? '—'} µg/m³</span>
        </div>
      </div>

      {(s.coordinates ||
        s.weather?.temperatureC != null ||
        s.weather?.relativeHumidityPct != null ||
        s.weather?.windSpeedMs != null) && (
        <div className="pt-2 border-t border-[#E2E7E1] flex flex-wrap items-center gap-3 text-[11px] text-[#565F58] font-mono">
          {s.coordinates && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#4D6B50]" />
              {s.coordinates.latitude.toFixed(3)}, {s.coordinates.longitude.toFixed(3)}
            </span>
          )}
          {s.weather?.temperatureC != null && (
            <span className="inline-flex items-center gap-1">
              <CloudSun className="w-3 h-3 text-[#4D6B50]" />
              {t(lang, 'ui_temp_label')} {s.weather.temperatureC}°C
            </span>
          )}
          {s.weather?.relativeHumidityPct != null && (
            <span>
              {t(lang, 'ui_humidity_label')} {s.weather.relativeHumidityPct}%
            </span>
          )}
          {s.weather?.windSpeedMs != null && (
            <span>
              {t(lang, 'ui_wind_label')} {s.weather.windSpeedMs} m/s
            </span>
          )}
        </div>
      )}
    </div>
  );
}
