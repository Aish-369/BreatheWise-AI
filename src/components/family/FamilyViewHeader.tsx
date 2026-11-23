import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

interface FamilyViewHeaderProps {
  lang: LanguageCode;
  mode: 'members' | 'guided';
  onSelectMode: (mode: 'members' | 'guided') => void;
}

export function FamilyViewHeader({ lang, mode, onSelectMode }: FamilyViewHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'onb_title')}</h1>
        <p className="mt-1 text-sm text-[#565F58]">{t(lang, 'onb_subtitle')}</p>
      </div>

      <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => onSelectMode('members')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            mode === 'members' ? 'bg-[#263C32] text-white' : 'text-[#565F58] hover:text-[#252D28]'
          }`}
        >
          {t(lang, 'tab_members')}
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('guided')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            mode === 'guided' ? 'bg-[#263C32] text-white' : 'text-[#565F58] hover:text-[#252D28]'
          }`}
        >
          {t(lang, 'tab_onboarding')}
        </button>
      </div>
    </div>
  );
}
