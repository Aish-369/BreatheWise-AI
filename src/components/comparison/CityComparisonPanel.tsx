import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { EnvironmentalSnapshot, LanguageCode } from '../../shared/types';
import { assessLocationComparisonCompatibility } from '../../engine/quality';
import { t } from '../../i18n/translations';
import { MetricComparisonGrid } from './MetricComparisonGrid';

interface CityComparisonPanelProps {
  lang: LanguageCode;
  availableCities: string[];
  slotA: string;
  slotB: string;
  primaryA: EnvironmentalSnapshot | null;
  primaryB: EnvironmentalSnapshot | null;
  onChangeSlotA: (city: string) => void;
  onChangeSlotB: (city: string) => void;
}

export function CityComparisonPanel({
  lang,
  availableCities,
  slotA,
  slotB,
  primaryA,
  primaryB,
  onChangeSlotA,
  onChangeSlotB,
}: CityComparisonPanelProps) {
  const compatibility = assessLocationComparisonCompatibility(primaryA, primaryB);

  const comparisonMetrics = [
    {
      label: 'PM2.5 (µg/m³)',
      valA: primaryA?.pollutants.pm25,
      valB: primaryB?.pollutants.pm25,
      max: 140,
    },
    {
      label: 'PM10 (µg/m³)',
      valA: primaryA?.pollutants.pm10,
      valB: primaryB?.pollutants.pm10,
      max: 200,
    },
    {
      label: 'NO2 (µg/m³)',
      valA: primaryA?.pollutants.no2,
      valB: primaryB?.pollutants.no2,
      max: 100,
    },
    { label: 'O3 (µg/m³)', valA: primaryA?.pollutants.o3, valB: primaryB?.pollutants.o3, max: 100 },
  ];

  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-2 font-medium text-[#252D28]">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#263C32]" />
            <span>{t(lang, 'ui_compare_slot_a')}:</span>
            <select
              value={slotA}
              onChange={(e) => onChangeSlotA(e.target.value)}
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
              onChange={(e) => onChangeSlotB(e.target.value)}
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

      <MetricComparisonGrid lang={lang} metrics={comparisonMetrics} />
    </div>
  );
}
