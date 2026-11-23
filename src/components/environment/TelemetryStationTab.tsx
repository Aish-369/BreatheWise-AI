import { Radio, ShieldCheck } from 'lucide-react';
import type {
  EnvironmentalSnapshot,
  LanguageCode,
  ProviderAdapterStatus,
} from '../../shared/types';
import { t } from '../../i18n/translations';
import { StationSnapshotCard } from './StationSnapshotCard';

function StationEvidenceTable({
  lang,
  city,
  availableSnapshots,
}: {
  lang: LanguageCode;
  city: string;
  availableSnapshots: EnvironmentalSnapshot[];
}) {
  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">
          {t(lang, 'dash_evidence_heading')} · {city}
        </h2>
        <span className="font-mono text-xs text-[#565F58] tabular-nums">
          {availableSnapshots.length} verified source(s)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E7E1] text-[#565F58] bg-[#F7F7F1]/55">
              <th className="py-2.5 px-5 font-medium">{t(lang, 'dash_source')}</th>
              <th className="py-2.5 px-4 font-medium">Classification</th>
              <th className="py-2.5 px-4 font-medium text-right">PM2.5</th>
              <th className="py-2.5 px-4 font-medium text-right">PM10</th>
              <th className="py-2.5 px-4 font-medium text-right">NO2</th>
              <th className="py-2.5 px-4 font-medium">Freshness</th>
              <th className="py-2.5 px-5 font-medium">{t(lang, 'dash_measured_at')}</th>
              <th className="py-2.5 px-5 font-medium">{t(lang, 'dash_retrieved_at')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E7E1]">
            {availableSnapshots.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-6 text-center text-xs text-[#565F58]">
                  No verified station records are available. No zero or placeholder measurements are
                  inserted.
                </td>
              </tr>
            ) : (
              availableSnapshots.map((s) => {
                const classKey = `cls_${s.classification ?? (s.isDemoFixture ? 'demo_fixture' : s.isAvailable ? 'verified_live' : 'unavailable')}`;
                return (
                  <tr key={s.id} className="hover:bg-[#F7F7F1]/70">
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-[#252D28]">{s.providerLabel}</p>
                      <p className="font-mono text-[11px] text-[#565F58]">{s.stationOrGridId}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[#252D28]">{t(lang, classKey)}</td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {typeof s.pollutants.pm25 === 'number' ? `${s.pollutants.pm25} µg/m³` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {typeof s.pollutants.pm10 === 'number' ? `${s.pollutants.pm10} µg/m³` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {typeof s.pollutants.no2 === 'number' ? `${s.pollutants.no2} µg/m³` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#263C32]">
                      {t(lang, `fresh_${s.freshness}`)}
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-[#565F58]">
                      {s.measuredAt
                        ? new Date(s.measuredAt).toLocaleString()
                        : t(lang, 'fresh_unavailable')}
                    </td>
                    <td className="py-3.5 px-5 font-mono tabular-nums text-[#565F58]">
                      {new Date(s.retrievedAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TelemetryStationTabProps {
  lang: LanguageCode;
  city: string;
  availableSnapshots: EnvironmentalSnapshot[];
  providerStatuses: ProviderAdapterStatus[];
}

export function TelemetryStationTab({
  lang,
  city,
  availableSnapshots,
  providerStatuses,
}: TelemetryStationTabProps) {
  return (
    <div className="space-y-6">
      {availableSnapshots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {availableSnapshots.map((s) => (
            <StationSnapshotCard key={s.id} lang={lang} snapshot={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E2E7E1] bg-white p-6">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            No verified station measurements available for {city}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#565F58]">
            Station metric cards are hidden until a real station observation is received. Regional
            CAMS model values, when available, are shown separately above and in the Forecast tab.
          </p>
        </div>
      )}

      <StationEvidenceTable lang={lang} city={city} availableSnapshots={availableSnapshots} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {providerStatuses.map((p) => (
          <div
            key={p.provider}
            className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <Radio className="w-4 h-4 text-[#263C32]" />
                <span className="px-2 py-0.5 rounded-md bg-[#F7F7F1] text-[11px] font-medium text-[#252D28] capitalize">
                  {p.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="mt-3 font-display text-sm font-semibold text-[#252D28]">{p.name}</h3>
              <p className="mt-1 text-xs font-medium text-[#263C32]">{p.licenseName}</p>
              <p className="mt-1.5 text-xs text-[#565F58]">{p.notes}</p>
            </div>
            <p className="mt-4 pt-3 border-t border-[#E2E7E1] text-[11px] text-[#565F58] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4D6B50] shrink-0" />
              <span className="truncate">{p.attributionText}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
