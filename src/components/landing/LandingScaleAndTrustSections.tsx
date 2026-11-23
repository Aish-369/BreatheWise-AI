import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import stationMonitoringPuneImg from '../../assets/images/station_monitoring_pune_1795249097066.webp';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

interface LandingScaleAndTrustSectionsProps {
  lang: LanguageCode;
  onEnterWorkspace: (section?: string) => void;
}

const NAQI_BANDS = [
  { band: 'Good', range: '0–50', action: 'Open windows & play', color: 'bg-[#489C6E]' },
  { band: 'Satisfactory', range: '51–100', action: 'Normal routines', color: 'bg-[#829C83]' },
  { band: 'Moderate', range: '101–200', action: 'Shift heavy walks', color: 'bg-[#D99B38]' },
  { band: 'Poor', range: '201–300', action: 'Move play indoors', color: 'bg-[#D96B38]' },
  { band: 'Very Poor', range: '301–400', action: 'Seal traffic windows', color: 'bg-[#C94438]' },
  { band: 'Severe', range: '401+', action: 'Essential travel only', color: 'bg-[#9E2323]' },
];

const TRUST_POINTS = [
  'Never invents air quality during outages',
  'Flags > 35 AQI station divergence cleanly',
  'Marks coarse-grid ~40 km forecast limits',
  'Non-medical daily planning guidance only',
];

export function LandingScaleAndTrustSections({
  lang,
  onEnterWorkspace,
}: LandingScaleAndTrustSectionsProps) {
  return (
    <>
      <section id="intelligence" className="border-t border-[#E2E7E1] bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#252D28]">
                {t(lang, 'landing_demo_title')}
              </h2>
              <p className="mt-1 text-sm text-[#565F58]">
                Verified India CPCB NAQI thresholds drive transparent household actions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEnterWorkspace('overview')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{t(lang, 'nav_openApp')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {NAQI_BANDS.map((item) => (
              <div
                key={item.band}
                className="rounded-xl border border-[#E2E7E1] bg-[#F7F7F1]/75 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className={`h-1.5 w-full rounded-full ${item.color}`} />
                  <p className="mt-3 font-display text-sm font-semibold text-[#252D28]">
                    {item.band}
                  </p>
                  <p className="font-mono text-xs text-[#565F58] tabular-nums">{item.range}</p>
                </div>
                <p className="mt-3 text-[11px] font-medium text-[#263C32]">{item.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="transparency" className="border-t border-[#E2E7E1] bg-[#F7F7F1] py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[#E2E7E1] min-h-[260px] bg-[#DCE9DD]">
            <img
              src={stationMonitoringPuneImg}
              alt="Ambient air quality monitoring station on urban rooftop"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B23]/80 via-transparent to-transparent flex items-end p-5">
              <p className="text-xs font-mono text-[#DCE9DD]">
                CPCB (GODL) · OpenAQ v3 · Copernicus CAMS
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-2xl p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#263C32]">
                <ShieldCheck className="w-4 h-4 text-[#4D6B50]" />
                <span>Verified Provenance Standard</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#252D28]">
                {t(lang, 'landing_trust_title')}
              </h2>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRUST_POINTS.map((pt) => (
                  <div
                    key={pt}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1]/70 text-xs text-[#252D28]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#3B6E52] shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#E2E7E1] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onEnterWorkspace('settings-trust')}
                className="px-4 py-2 text-xs font-medium border border-[#E2E7E1] bg-[#F7F7F1] text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/50 transition-colors cursor-pointer"
              >
                {t(lang, 'hero_cta_secondary')}
              </button>
              <button
                type="button"
                onClick={() => onEnterWorkspace('overview')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] transition-colors cursor-pointer"
              >
                <span>{t(lang, 'nav_openApp')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
