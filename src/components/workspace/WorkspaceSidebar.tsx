import { ArrowLeft } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { ActiveSection } from '../../hooks/useNavigationState';
import type { NavItem } from './navConfig';

interface WorkspaceSidebarProps {
  lang: LanguageCode;
  activeTab: ActiveSection;
  navItems: NavItem[];
  householdName?: string;
  householdCity?: string;
  memberCount: number;
  onNavigate: (section: ActiveSection) => void;
  onBackToLanding: () => void;
  onChangeLang: (code: LanguageCode) => void;
}

export function WorkspaceSidebar({
  lang,
  activeTab,
  navItems,
  householdName,
  householdCity,
  memberCount,
  onNavigate,
  onBackToLanding,
  onChangeLang,
}: WorkspaceSidebarProps) {
  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:sticky lg:top-0 lg:h-screen border-r border-[#E2E7E1] bg-white shrink-0">
      <div className="px-5 h-16 border-b border-[#E2E7E1] flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-left cursor-pointer"
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
          <span className="font-display text-sm font-bold tracking-tight text-[#252D28]">
            {t(lang, 'brandName')}
          </span>
        </button>
        <button
          type="button"
          onClick={onBackToLanding}
          aria-label={t(lang, 'nav_backToSite')}
          title={t(lang, 'nav_backToSite')}
          className="p-1.5 rounded-md text-[#525C56] hover:text-[#252D28] hover:bg-[#F7F7F1] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.7} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Workspace navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all text-left cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#DCE9DD]/75 to-[#DCE9DD]/30 text-[#263C32] shadow-2xs'
                  : 'text-[#565F58] hover:text-[#252D28] hover:bg-[#F7F7F1]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${active ? 'text-[#263C32]' : 'text-[#565F58]'}`}
                strokeWidth={1.75}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3.5 border-t border-[#E2E7E1]">
        <div className="rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] p-3 space-y-2.5">
          <div>
            <p className="text-xs font-semibold text-[#252D28] truncate">
              {householdName ?? 'BreatheWise AI'}
            </p>
            <p className="text-[11px] text-[#565F58]">
              {householdCity ?? 'Pune'} · {memberCount} {t(lang, 'tab_members').toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-1 pt-2 border-t border-[#E2E7E1]">
            {(['en', 'mr', 'hi'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLang(code)}
                className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  lang === code ? 'bg-[#263C32] text-white' : 'text-[#565F58] hover:text-[#252D28]'
                }`}
              >
                {code === 'en' ? 'EN' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
