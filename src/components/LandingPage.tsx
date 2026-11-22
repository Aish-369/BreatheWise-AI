import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import heroFamilyMorningImg from '../assets/images/hero_family_morning_1795249097204.jpg';
import stationMonitoringPuneImg from '../assets/images/station_monitoring_pune_1795249097066.jpg';
import type { LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';
import { AqiGauge } from './AqiGauge';

interface LandingPageProps {
  lang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
  onEnterWorkspace: (section?: string) => void;
}

export function LandingPage({ lang, onChangeLang, onEnterWorkspace }: LandingPageProps) {
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
    <div className="min-h-screen bg-[#F7F7F1] text-[#252D28]">
      {/* Clean 3-Zone Top Bar */}
      <header className="border-b border-[#E2E7E1] bg-[#F7F7F1]/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="inline-flex items-center gap-2 text-base font-display font-semibold tracking-tight text-[#252D28] whitespace-nowrap shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect width="24" height="24" rx="6" fill="#263C32" />
              <path
                d="M7 14.5C7 10.5 10.5 7 16.5 7C16.5 13 13 16.5 9 16.5C8.1 16.5 7.4 16.2 7 15.8"
                stroke="#DCE9DD"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path d="M7 17L12 12" stroke="#829C83" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>{t(lang, 'brandName')}</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#89918A]">
            <a href="#capabilities" className="hover:text-[#252D28] transition-colors whitespace-nowrap shrink-0">
              {t(lang, 'nav_howItWorks')}
            </a>
            <a href="#intelligence" className="hover:text-[#252D28] transition-colors whitespace-nowrap shrink-0">
              {t(lang, 'nav_intelligence')}
            </a>
            <a href="#transparency" className="hover:text-[#252D28] transition-colors whitespace-nowrap shrink-0">
              {t(lang, 'nav_transparency')}
            </a>
            <button
              type="button"
              onClick={() => onEnterWorkspace('locations')}
              className="hover:text-[#252D28] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t(lang, 'side_locations')}
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onEnterWorkspace('overview')}
              className="px-4 py-2 text-sm font-medium bg-[#263C32] text-[#FFFFFF] rounded-lg hover:bg-[#1C2D25] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              {t(lang, 'nav_openApp')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Split with Interactive Live Intelligence Preview */}
      <section
        id="top"
        className="relative overflow-hidden border-b border-[#E2E7E1] bg-gradient-to-b from-[#DCE9DD]/35 via-[#F7F7F1] to-[#F7F7F1]"
      >
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Proposition */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <span className="text-xs font-medium text-[#263C32]">
                    {t(lang, 'hero_kicker')}
                  </span>
                  <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shadow-2xs">
                    {(['en', 'mr', 'hi'] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => onChangeLang(code)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          lang === code
                            ? 'bg-[#263C32] text-white'
                            : 'text-[#89918A] hover:text-[#252D28]'
                        }`}
                      >
                        {code === 'en' ? 'EN' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
                      </button>
                    ))}
                  </div>
                </div>

                <h1 className="font-display text-[clamp(2.2rem,3.8vw,3.25rem)] font-bold leading-[1.09] tracking-tight text-[#252D28] text-balance">
                  {t(lang, 'hero_title')}
                </h1>
                <p className="mt-4 text-[15px] leading-relaxed text-[#89918A] max-w-lg">
                  {t(lang, 'hero_subtitle')}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('overview')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                  >
                    <span>{t(lang, 'hero_cta_primary')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('family-setup')}
                    className="px-5 py-2.5 text-sm font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t(lang, 'action_startOnboarding')}
                  </button>
                </div>
              </div>

              {/* Compact 4-Metric Architecture Row */}
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#E2E7E1]">
                <div>
                  <p className="font-mono text-sm font-semibold text-[#263C32] tabular-nums">100%</p>
                  <p className="text-xs text-[#89918A]">Deterministic rules</p>
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold text-[#263C32] tabular-nums">5</p>
                  <p className="text-xs text-[#89918A]">Data tiers separated</p>
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold text-[#263C32]">SQLite</p>
                  <p className="text-xs text-[#89918A]">Local-first privacy</p>
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold text-[#263C32]">3</p>
                  <p className="text-xs text-[#89918A]">EN · मराठी · हिन्दी</p>
                </div>
              </div>
            </div>

            {/* Right Interactive Live Product Preview */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col"
            >
              <div className="flex-1 rounded-2xl bg-gradient-to-br from-[#263C32] via-[#2C463A] to-[#1A2B23] text-white p-6 shadow-[0_14px_38px_rgba(38,60,50,0.16)] flex flex-col justify-center gap-5">
                {/* Preview Controls */}
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

                {/* Animated Gauge + Telemetry */}
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
                    <p className="text-base font-display font-semibold text-white">
                      {previewData.city}
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono tabular-nums">
                      <div className="rounded-lg bg-white/8 p-2">
                        <span className="block text-[10px] text-[#DCE9DD]/80">PM2.5</span>
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

                {/* Live Member & Routine Preview */}
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
                    <span className="font-mono text-[#DCE9DD] tabular-nums shrink-0">
                      06:00–09:00
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Capabilities Visual Bento */}
      <section id="capabilities" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#252D28] text-balance">
              {t(lang, 'landing_flow_title')}
            </h2>
            <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'landing_flow_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => onEnterWorkspace('simulator')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-white border border-[#E2E7E1] rounded-lg text-[#252D28] hover:bg-[#DCE9DD]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#263C32]" />
            <span>{t(lang, 'side_simulator')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Tall Photography Card */}
          <div className="md:col-span-5 relative rounded-2xl overflow-hidden border border-[#E2E7E1] min-h-[290px] bg-[#DCE9DD]">
            <img
              src={heroFamilyMorningImg}
              alt="Sunlit urban family home interior with green balcony"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A2B23]/85 via-[#1A2B23]/25 to-transparent flex flex-col justify-end p-6 text-white">
              <p className="text-xs font-medium text-[#DCE9DD]">Household Context First</p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                Tailored to infants, school children, adults, and older parents
              </h3>
            </div>
          </div>

          {/* 4 Visual Feature Cards */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Activity,
                title: t(lang, 'landing_step_1'),
                desc: 'Separates physical stations, bulletins, forecasts, and outages automatically.',
                stat: '≤ 2h Fresh · > 6h Stale',
              },
              {
                icon: Users,
                title: t(lang, 'landing_step_2'),
                desc: 'Local household profiles in SQLite with zero clinical or personal IDs.',
                stat: '4 Sensitivity Tiers',
              },
              {
                icon: CalendarClock,
                title: t(lang, 'landing_step_3'),
                desc: 'Practical fixed-commute precautions + forecast-backed flexible shifts.',
                stat: 'India CPCB NAQI',
              },
              {
                icon: Database,
                title: t(lang, 'landing_step_4'),
                desc: 'Interactive What-If pollution spikes, indoor swaps, and PDF briefings.',
                stat: 'Zero-Cost Engine',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex flex-col justify-between hover:border-[#829C83] transition-colors shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#DCE9DD] to-[#F7F7F1] border border-[#E2E7E1] flex items-center justify-center text-[#263C32]">
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                    </div>
                    <h3 className="mt-3.5 font-display text-sm font-semibold text-[#252D28]">
                      {card.title}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#89918A]">{card.desc}</p>
                  </div>
                  <p className="mt-4 pt-3 border-t border-[#E2E7E1] font-mono text-[11px] font-medium text-[#263C32]">
                    {card.stat}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive AQI Scale & Intelligence Preview Strip */}
      <section id="intelligence" className="border-t border-[#E2E7E1] bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#252D28]">
                {t(lang, 'landing_demo_title')}
              </h2>
              <p className="mt-1 text-sm text-[#89918A]">
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
            {[
              { band: 'Good', range: '0–50', action: 'Open windows & play', color: 'bg-[#489C6E]' },
              { band: 'Satisfactory', range: '51–100', action: 'Normal routines', color: 'bg-[#829C83]' },
              { band: 'Moderate', range: '101–200', action: 'Shift heavy walks', color: 'bg-[#D99B38]' },
              { band: 'Poor', range: '201–300', action: 'Move play indoors', color: 'bg-[#D96B38]' },
              { band: 'Very Poor', range: '301–400', action: 'Seal traffic windows', color: 'bg-[#C94438]' },
              { band: 'Severe', range: '401+', action: 'Essential travel only', color: 'bg-[#9E2323]' },
            ].map((item) => (
              <div
                key={item.band}
                className="rounded-xl border border-[#E2E7E1] bg-[#F7F7F1]/75 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className={`h-1.5 w-full rounded-full ${item.color}`} />
                  <p className="mt-3 font-display text-sm font-semibold text-[#252D28]">{item.band}</p>
                  <p className="font-mono text-xs text-[#89918A] tabular-nums">{item.range}</p>
                </div>
                <p className="mt-3 text-[11px] font-medium text-[#263C32]">{item.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency & Station Visual Section */}
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
                <ShieldCheck className="w-4 h-4 text-[#829C83]" />
                <span>Verified Provenance Standard</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#252D28]">
                {t(lang, 'landing_trust_title')}
              </h2>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Never invents air quality during outages',
                  'Flags > 35 AQI station divergence cleanly',
                  'Marks coarse-grid ~40 km forecast limits',
                  'Non-medical daily planning guidance only',
                ].map((pt) => (
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

      <footer className="border-t border-[#E2E7E1] bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#89918A]">
          <p className="font-medium text-[#252D28]">BreatheWise AI · {t(lang, 'tagline')}</p>
          <p>Informational daily protection aid only; not medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
