import { Menu, RefreshCw } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import type { BootstrapPayload } from '../../utils/api';
import { t } from '../../i18n/translations';
import type { ActiveSection } from '../../hooks/useNavigationState';
import type { NavItem, WorkspaceAlert } from './navConfig';
import { HeaderAlertsMenu, HeaderLocationMenu, HeaderProfileMenu } from './HeaderDropdownMenus';

interface WorkspaceHeaderProps {
  lang: LanguageCode;
  data: BootstrapPayload | null;
  loading: boolean;
  activeTab: ActiveSection;
  navItems: NavItem[];
  activeAlerts: WorkspaceAlert[];
  mobileMenuOpen: boolean;
  locationMenuOpen: boolean;
  alertsMenuOpen: boolean;
  profileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
  onToggleLocationMenu: () => void;
  onToggleAlertsMenu: () => void;
  onToggleProfileMenu: () => void;
  onQuickSwitchCity: (city: string, locality: string) => void;
  onNavigateSection: (target?: string) => void;
  onChangeLang: (code: LanguageCode) => void;
  onBackToLanding: () => void;
  onRefresh: () => void;
}

export function WorkspaceHeader({
  lang,
  data,
  loading,
  activeTab,
  navItems,
  activeAlerts,
  mobileMenuOpen,
  locationMenuOpen,
  alertsMenuOpen,
  profileMenuOpen,
  onOpenMobileMenu,
  onToggleLocationMenu,
  onToggleAlertsMenu,
  onToggleProfileMenu,
  onQuickSwitchCity,
  onNavigateSection,
  onChangeLang,
  onBackToLanding,
  onRefresh,
}: WorkspaceHeaderProps) {
  const savedLocations = data?.locations ?? [];
  const quickCities =
    savedLocations.length > 0
      ? savedLocations
      : [
          {
            id: 'fallback-pune',
            city: data?.household?.city ?? 'Pune',
            locality: data?.household?.locality ?? '',
            label: data?.household?.city ?? 'Pune',
            isPrimary: true,
          },
        ];

  return (
    <header className="border-b border-[#E2E7E1] bg-white/95 backdrop-blur-xs h-16 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg border border-[#E2E7E1] text-[#252D28] cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="text-xs text-[#565F58] truncate">
          <span className="text-[#252D28] font-medium">
            {data?.household?.name ?? 'BreatheWise AI'}
          </span>
          <span aria-hidden="true"> / </span>
          <span>{navItems.find((n) => n.id === activeTab)?.label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 relative">
        {data?.household && (
          <HeaderLocationMenu
            lang={lang}
            activeCity={data.household.city}
            quickCities={quickCities}
            open={locationMenuOpen}
            onToggle={onToggleLocationMenu}
            onQuickSwitchCity={onQuickSwitchCity}
            onNavigateSection={onNavigateSection}
          />
        )}

        <HeaderAlertsMenu
          lang={lang}
          activeAlerts={activeAlerts}
          open={alertsMenuOpen}
          onToggle={onToggleAlertsMenu}
          onNavigateSection={onNavigateSection}
        />

        <HeaderProfileMenu
          lang={lang}
          data={data}
          open={profileMenuOpen}
          onToggle={onToggleProfileMenu}
          onChangeLang={onChangeLang}
          onNavigateSection={onNavigateSection}
          onBackToLanding={onBackToLanding}
        />

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#263C32] ${loading ? 'animate-spin' : ''}`}
            strokeWidth={1.7}
          />
          <span className="hidden sm:inline">{t(lang, 'action_refresh')}</span>
        </button>
      </div>
    </header>
  );
}
