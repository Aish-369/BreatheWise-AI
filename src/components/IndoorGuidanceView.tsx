import { Droplets, Fan, ShieldAlert, Wind } from 'lucide-react';
import indoorVentilationImg from '../assets/images/indoor_ventilation_home_1795249096895.webp';
import type { AqiBand, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';

interface IndoorGuidanceViewProps {
  lang: LanguageCode;
  currentBand: AqiBand;
  city: string;
}

export function IndoorGuidanceView({ lang, currentBand, city }: IndoorGuidanceViewProps) {
  const outdoorUnavailable = currentBand === 'unavailable';
  const highOutdoor =
    currentBand === 'poor' || currentBand === 'very_poor' || currentBand === 'severe';
  const avoidOutdoorActiveTravel = outdoorUnavailable || currentBand === 'moderate' || highOutdoor;

  const cards = [
    {
      icon: Wind,
      title: t(lang, 'indoor_card_vent_title'),
      badge: outdoorUnavailable
        ? 'Data unavailable'
        : highOutdoor
          ? t(lang, 'indoor_badge_closed')
          : t(lang, 'indoor_badge_nonpeak'),
      desc: outdoorUnavailable
        ? 'Outdoor station data is unavailable. Check a trusted local AQI source before deciding when to ventilate.'
        : t(lang, 'indoor_card_vent_desc'),
    },
    {
      icon: Fan,
      title: t(lang, 'indoor_card_kitchen_title'),
      badge: t(lang, 'indoor_card_kitchen_badge'),
      desc: t(lang, 'indoor_card_kitchen_desc'),
    },
    {
      icon: Droplets,
      title: t(lang, 'indoor_card_mop_title'),
      badge: t(lang, 'indoor_card_mop_badge'),
      desc: t(lang, 'indoor_card_mop_desc'),
    },
    {
      icon: ShieldAlert,
      title: t(lang, 'indoor_card_sleep_title'),
      badge: t(lang, 'indoor_card_sleep_badge'),
      desc: t(lang, 'indoor_card_sleep_desc'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
        <div className="lg:col-span-5 min-h-[240px] bg-[#DCE9DD]">
          <img
            src={indoorVentilationImg}
            alt={t(lang, 'indoor_title')}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between bg-gradient-to-br from-white to-[#DCE9DD]/25">
          <div>
            <p className="text-xs font-medium text-[#263C32]">
              {city} · {t(lang, `band_${currentBand}`)}
            </p>
            <h2 className="mt-1.5 font-display text-xl font-bold text-[#252D28]">
              {outdoorUnavailable
                ? 'Outdoor air data is unavailable'
                : highOutdoor
                  ? t(lang, 'indoor_hero_high')
                  : t(lang, 'indoor_hero_mod')}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#565F58]">
              {outdoorUnavailable
                ? 'No verified outdoor station measurement is available for this location. These indoor practices remain useful, but this page cannot currently classify outdoor air as safe or unsafe.'
                : highOutdoor
                  ? t(lang, 'indoor_hero_high_desc')
                  : t(lang, 'indoor_hero_mod_desc')}
            </p>
          </div>
          <p className="mt-6 pt-4 border-t border-[#E2E7E1] text-xs text-[#565F58]">
            {t(lang, 'indoor_disclaimer')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-[#565F58]">{item.badge}</span>
                </div>
                <h3 className="mt-3.5 font-display text-sm font-semibold text-[#252D28]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#565F58]">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <section
        aria-labelledby="sustainable-actions-heading"
        className="bg-white border border-[#E2E7E1] rounded-2xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
      >
        <div className="max-w-3xl">
          <h2
            id="sustainable-actions-heading"
            className="font-display text-lg font-semibold text-[#252D28]"
          >
            {t(lang, 'sustainable_choices_title')}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#565F58]">
            {t(lang, 'sustainable_choices_subtitle')}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-4">
            <h3 className="text-sm font-semibold text-[#252D28]">
              {t(lang, 'low_emission_title')}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#565F58]">
              {t(lang, avoidOutdoorActiveTravel ? 'low_emission_caution' : 'low_emission_clear')}
            </p>
          </article>

          <article className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-4">
            <h3 className="text-sm font-semibold text-[#252D28]">
              {t(lang, 'indoor_hacks_title')}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#565F58]">
              {t(lang, 'indoor_hacks_desc')}
            </p>
          </article>

          <article className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-4">
            <h3 className="text-sm font-semibold text-[#252D28]">
              {t(lang, 'sustainable_swaps_title')}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#565F58]">
              {t(lang, 'sustainable_swaps_desc')}
            </p>
          </article>
        </div>

        <p className="mt-4 border-t border-[#E2E7E1] pt-3 text-xs leading-relaxed text-[#565F58]">
          {t(lang, 'sustainable_impact_note')}
        </p>
      </section>
    </div>
  );
}
