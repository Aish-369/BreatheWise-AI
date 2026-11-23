import { X } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { ActiveSection } from '../../hooks/useNavigationState';
import type { NavItem } from './navConfig';

interface WorkspaceMobileDrawerProps {
  open: boolean;
  lang: LanguageCode;
  activeTab: ActiveSection;
  navItems: NavItem[];
  householdCity?: string;
  onClose: () => void;
  onNavigate: (section: ActiveSection) => void;
  onChangeLang: (code: LanguageCode) => void;
}

export function WorkspaceMobileDrawer({
  open,
  lang,
  activeTab,
  navItems,
  householdCity,
  onClose,
  onNavigate,
  onChangeLang,
}: WorkspaceMobileDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="Workspace menu"
    >
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="fixed inset-0 bg-[#252D28]/35 backdrop-blur-xs cursor-default"
      />
      <div className="relative w-68 max-w-[84vw] bg-white h-full border-r border-[#E2E7E1] flex flex-col z-10">
        <div className="px-5 h-16 border-b border-[#E2E7E1] flex items-center justify-between">
          <span className="font-display text-sm font-bold text-[#252D28]">
            {t(lang, 'brandName')}
          </span>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
            className="p-1.5 text-[#525C56] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav
          className="flex-1 p-3 space-y-1 overflow-y-auto"
          aria-label="Mobile workspace navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left cursor-pointer ${
                  active ? 'bg-[#DCE9DD]/70 text-[#263C32]' : 'text-[#89918A]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#E2E7E1] flex items-center justify-between text-xs text-[#89918A]">
          <span>{householdCity ?? 'Pune'}</span>
          <div className="inline-flex gap-1">
            {(['en', 'mr', 'hi'] as const).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                onClick={() => onChangeLang(code)}
                className={`px-2 py-1 rounded-md cursor-pointer ${
                  lang === code
                    ? 'bg-[#263C32] text-white font-medium'
                    : 'text-[#525C56] hover:text-[#252D28]'
                }`}
              >
                {code === 'en' ? 'EN' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
