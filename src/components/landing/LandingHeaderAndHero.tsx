import { ArrowRight } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import { LandingHeroPreview } from './LandingHeroPreview';

interface LandingTopHeaderProps {
  lang: LanguageCode;
  onEnterWorkspace: (section?: string) => void;
}

export function LandingTopHeader({ lang, onEnterWorkspace }: LandingTopHeaderProps) {
  return (
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

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#565F58]">
          <a
            href="#capabilities"
            className="hover:text-[#252D28] transition-colors whitespace-nowrap shrink-0"
          >
            {t(lang, 'nav_howItWorks')}
          </a>
          <a
            href="#intelligence"
            className="hover:text-[#252D28] transition-colors whitespace-nowrap shrink-0"
          >
            {t(lang, 'nav_intelligence')}
          </a>
          <a
            href="#transparency"
            className="hover:text-[#252D28] transition-colors whitespace-nowrap shrink-0"
          >
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
  );
}

interface LandingHeroSectionProps {
  lang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
  onEnterWorkspace: (section?: string) => void;
}

export function LandingHeroSection({
  lang,
  onChangeLang,
  onEnterWorkspace,
}: LandingHeroSectionProps) {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-[#E2E7E1] bg-gradient-to-b from-[#DCE9DD]/35 via-[#F7F7F1] to-[#F7F7F1]"
    >
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <span className="text-xs font-medium text-[#263C32]">{t(lang, 'hero_kicker')}</span>
                <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shadow-2xs">
                  {(['en', 'mr', 'hi'] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onChangeLang(code)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        lang === code
                          ? 'bg-[#263C32] text-white'
                          : 'text-[#565F58] hover:text-[#252D28]'
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
              <p className="mt-4 text-[15px] leading-relaxed text-[#565F58] max-w-lg">
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

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#E2E7E1]">
              <div>
                <p className="font-mono text-sm font-semibold text-[#263C32] tabular-nums">100%</p>
                <p className="text-xs text-[#565F58]">Deterministic rules</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#263C32] tabular-nums">5</p>
                <p className="text-xs text-[#565F58]">Data tiers separated</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#263C32]">SQLite</p>
                <p className="text-xs text-[#565F58]">Local-first privacy</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#263C32]">3</p>
                <p className="text-xs text-[#565F58]">EN · मराठी · हिन्दी</p>
              </div>
            </div>
          </div>

          <LandingHeroPreview lang={lang} />
        </div>
      </div>
    </section>
  );
}
