import { useState } from 'react';
import { motion } from 'motion/react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import { AqiGauge } from '../AqiGauge';

interface LandingHeroPreviewProps {
  lang: LanguageCode;
}

export function LandingHeroPreview({ lang }: LandingHeroPreviewProps) {
  const [previewCity, setPreviewCity] = useState<'pune' | 'ahilyanagar'>('pune');
  const [previewShifted, setPreviewShifted] = useState(true);

  const previewData =
    previewCity === 'pune'
      ? {
          city: 'Pune · Shivajinagar',
          aqi: previewShifted ? 127 : 148,
          band: 'moderate' as const,
          bandLabel: t(lang, 'band_moderate'),
          pm25: previewShifted ? 68 : 74,
          pm10: 124,
          freshness: t(lang, 'fresh_fresh'),
          source: 'Illustrative reference · Not live',
          walkTime: previewShifted ? '12:00–16:00' : '06:00–09:00',
          walkStatus: previewShifted ? 'Shifted (Est. PM2.5 ~44 µg/m³)' : 'Peak Morning Traffic',
        }
      : {
          city: 'Ahilyanagar · Municipal Center',
          aqi: 108,
          band: 'moderate' as const,
          bandLabel: t(lang, 'band_moderate'),
          pm25: 54,
          pm10: 112,
          freshness: t(lang, 'fresh_aging'),
          source: 'Illustrative reference · Not live',
          walkTime: '06:00–09:00',
          walkStatus: 'No forecast loaded · Hold shift',
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="lg:col-span-6 flex flex-col"
    >
      <div className="flex-1 rounded-2xl bg-gradient-to-br from-[#263C32] via-[#2C463A] to-[#1A2B23] text-white p-6 shadow-[0_14px_38px_rgba(38,60,50,0.16)] flex flex-col justify-center gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div className="inline-flex items-center gap-1 p-0.5 bg-white/10 rounded-lg">
            <button
              type="button"
              onClick={() => setPreviewCity('pune')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                previewCity === 'pune'
                  ? 'bg-white text-[#263C32]'
                  : 'text-[#DCE9DD] hover:text-white'
              }`}
            >
              Pune
            </button>
            <button
              type="button"
              onClick={() => setPreviewCity('ahilyanagar')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                previewCity === 'ahilyanagar'
                  ? 'bg-white text-[#263C32]'
                  : 'text-[#DCE9DD] hover:text-white'
              }`}
            >
              Ahilyanagar
            </button>
          </div>

          {previewCity === 'pune' && (
            <button
              type="button"
              onClick={() => setPreviewShifted((s) => !s)}
              className="px-3 py-1 text-xs font-medium bg-[#DCE9DD]/15 hover:bg-[#DCE9DD]/25 text-[#DCE9DD] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {previewShifted ? 'View Morning Peak' : 'Apply Afternoon Shift'}
            </button>
          )}
        </div>

        <div className="py-2 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-5 flex justify-center">
            <AqiGauge
              aqi={previewData.aqi}
              band={previewData.band}
              bandLabel={previewData.bandLabel}
              isAvailable
              darkSurface
              size="sm"
            />
          </div>
          <div className="sm:col-span-7 space-y-2.5">
            <p className="text-xs text-[#DCE9DD]">{previewData.source}</p>
            <p className="text-base font-display font-semibold text-white">{previewData.city}</p>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono tabular-nums">
              <div className="rounded-lg bg-white/8 p-2">
                <span className="block text-[10px] text-[#DCE9DD]">PM2.5</span>
                <span className="font-semibold text-white">{previewData.pm25} µg</span>
              </div>
              <div className="rounded-lg bg-white/8 p-2">
                <span className="block text-[10px] text-[#DCE9DD]/80">PM10</span>
                <span className="font-semibold text-white">{previewData.pm10} µg</span>
              </div>
              <div className="rounded-lg bg-white/8 p-2">
                <span className="block text-[10px] text-[#DCE9DD]/80">Status</span>
                <span className="font-sans font-medium text-[#DCE9DD]">
                  {previewData.freshness.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-white/10 text-xs">
          <div className="rounded-lg bg-white/8 px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">Morning walk · Older adult</p>
              <p className="text-[11px] text-[#DCE9DD]">{previewData.walkStatus}</p>
            </div>
            <span className="font-mono text-[#DCE9DD] tabular-nums shrink-0">
              {previewData.walkTime}
            </span>
          </div>
          <div className="rounded-lg bg-white/8 px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">School commute · School-age member</p>
              <p className="text-[11px] text-[#DCE9DD]">
                Low-traffic route · Wash face after return
              </p>
            </div>
            <span className="font-mono text-[#DCE9DD] tabular-nums shrink-0">06:00–09:00</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
