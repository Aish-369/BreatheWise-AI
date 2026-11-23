import type { LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';
import { LandingHeroSection, LandingTopHeader } from './landing/LandingHeaderAndHero';
import { LandingCapabilitiesSection } from './landing/LandingCapabilitiesSection';
import { LandingScaleAndTrustSections } from './landing/LandingScaleAndTrustSections';

interface LandingPageProps {
  lang: LanguageCode;
  onChangeLang: (lang: LanguageCode) => void;
  onEnterWorkspace: (section?: string) => void;
}

export function LandingPage({ lang, onChangeLang, onEnterWorkspace }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#F7F7F1] text-[#252D28]">
      <LandingTopHeader lang={lang} onEnterWorkspace={onEnterWorkspace} />

      <main>
        <LandingHeroSection
          lang={lang}
          onChangeLang={onChangeLang}
          onEnterWorkspace={onEnterWorkspace}
        />
        <LandingCapabilitiesSection lang={lang} onEnterWorkspace={onEnterWorkspace} />
        <LandingScaleAndTrustSections lang={lang} onEnterWorkspace={onEnterWorkspace} />
      </main>

      <footer className="border-t border-[#E2E7E1] bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#565F58]">
          <p className="font-medium text-[#252D28]">BreatheWise AI · {t(lang, 'tagline')}</p>
          <p>Informational daily protection aid only; not medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
