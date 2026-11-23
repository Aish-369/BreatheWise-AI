import { Activity, CalendarClock, Database, SlidersHorizontal, Users } from 'lucide-react';
import heroFamilyMorningImg from '../../assets/images/hero_family_morning_1795249097204.webp';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

interface LandingCapabilitiesSectionProps {
  lang: LanguageCode;
  onEnterWorkspace: (section?: string) => void;
}

export function LandingCapabilitiesSection({
  lang,
  onEnterWorkspace,
}: LandingCapabilitiesSectionProps) {
  const cards = [
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
  ];

  return (
    <section id="capabilities" className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#252D28] text-balance">
            {t(lang, 'landing_flow_title')}
          </h2>
          <p className="mt-1 text-sm text-[#565F58]">{t(lang, 'landing_flow_subtitle')}</p>
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

        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {cards.map((card) => {
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
                  <p className="mt-1.5 text-xs leading-relaxed text-[#565F58]">{card.desc}</p>
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
  );
}
