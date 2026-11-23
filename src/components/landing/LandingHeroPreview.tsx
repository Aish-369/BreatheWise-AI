import { useState } from 'react';
import { motion } from 'motion/react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import { HeroPreviewBody, type HeroPreviewData } from './HeroPreviewBody';

function buildPreviewData(
  lang: LanguageCode,
  city: 'pune' | 'ahilyanagar',
  shifted: boolean
): HeroPreviewData {
  if (city === 'pune') {
    return {
      city: 'Pune · Shivajinagar',
      aqi: shifted ? 127 : 148,
      band: 'moderate',
      bandLabel: t(lang, 'band_moderate'),
      pm25: shifted ? 68 : 74,
      pm10: 124,
      freshness: t(lang, 'fresh_fresh'),
      source: 'Illustrative reference · Not live',
      walkTime: shifted ? '12:00–16:00' : '06:00–09:00',
      walkStatus: shifted ? 'Shifted (Est. PM2.5 ~44 µg/m³)' : 'Peak Morning Traffic',
    };
  }
  return {
    city: 'Ahilyanagar · Municipal Center',
    aqi: 108,
    band: 'moderate',
    bandLabel: t(lang, 'band_moderate'),
    pm25: 54,
    pm10: 112,
    freshness: t(lang, 'fresh_aging'),
    source: 'Illustrative reference · Not live',
    walkTime: '06:00–09:00',
    walkStatus: 'No forecast loaded · Hold shift',
  };
}

export function LandingHeroPreview({ lang }: { lang: LanguageCode }) {
  const [previewCity, setPreviewCity] = useState<'pune' | 'ahilyanagar'>('pune');
  const [previewShifted, setPreviewShifted] = useState(true);
  const previewData = buildPreviewData(lang, previewCity, previewShifted);

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

        <HeroPreviewBody data={previewData} />
      </div>
    </motion.div>
  );
}
