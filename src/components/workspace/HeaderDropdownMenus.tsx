import { AlertTriangle, Bell, ChevronDown, Info, MapPin, User } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import type { BootstrapPayload } from '../../utils/api';
import { t } from '../../i18n/translations';
import type { WorkspaceAlert } from './navConfig';

interface QuickCity {
  id: string;
  city: string;
  locality: string;
  label: string;
  isPrimary: boolean;
}

interface HeaderLocationMenuProps {
  lang: LanguageCode;
  activeCity: string;
  quickCities: QuickCity[];
  open: boolean;
  onToggle: () => void;
  onQuickSwitchCity: (city: string, locality: string) => void;
  onNavigateSection: (target?: string) => void;
}

export function HeaderLocationMenu({
  lang,
  activeCity,
  quickCities,
  open,
  onToggle,
  onQuickSwitchCity,
  onNavigateSection,
}: HeaderLocationMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t(lang, 'ui_location_label')}
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E2E7E1] bg-[#F7F7F1] text-[#252D28] rounded-lg hover:bg-[#DCE9DD]/45 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <MapPin className="w-3.5 h-3.5 text-[#263C32]" />
        <span className="hidden sm:inline">{activeCity}</span>
        <ChevronDown className="w-3 h-3 text-[#565F58]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-[#E2E7E1] shadow-lg p-1.5 z-30 text-xs">
          <p className="px-2.5 py-1.5 text-[11px] font-medium text-[#565F58]">
            {t(lang, 'ui_location_label')}
          </p>
          {quickCities.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => onQuickSwitchCity(loc.city, loc.locality)}
              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer ${
                activeCity === loc.city
                  ? 'bg-[#DCE9DD]/65 font-semibold text-[#263C32]'
                  : 'text-[#252D28] hover:bg-[#F7F7F1]'
              }`}
            >
              <span className="truncate">
                {loc.city}
                {loc.label && loc.label !== loc.city ? ` (${loc.label})` : ''}
              </span>
              {loc.isPrimary && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#263C32] shrink-0">
                  Primary
                </span>
              )}
            </button>
          ))}
          <div className="my-1 border-t border-[#E2E7E1]" />
          <button
            type="button"
            onClick={() => onNavigateSection('locations')}
            className="w-full text-left px-2.5 py-2 rounded-lg text-[#263C32] font-medium hover:bg-[#F7F7F1] cursor-pointer"
          >
            {t(lang, 'ui_nav_manage_locations')}
          </button>
        </div>
      )}
    </div>
  );
}

interface HeaderAlertsMenuProps {
  lang: LanguageCode;
  activeAlerts: WorkspaceAlert[];
  open: boolean;
  onToggle: () => void;
  onNavigateSection: (target?: string) => void;
}

export function HeaderAlertsMenu({
  lang,
  activeAlerts,
  open,
  onToggle,
  onNavigateSection,
}: HeaderAlertsMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t(lang, 'ui_alerts_title')}
        onClick={onToggle}
        className="relative p-2 border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#F7F7F1] transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4 text-[#263C32]" strokeWidth={1.7} />
        {activeAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#263C32] text-white text-[10px] font-mono flex items-center justify-center tabular-nums">
            {activeAlerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-white border border-[#E2E7E1] shadow-lg p-3 z-30 space-y-2.5">
          <p className="text-xs font-semibold text-[#252D28]">{t(lang, 'ui_alerts_title')}</p>
          {activeAlerts.length === 0 ? (
            <p className="text-xs text-[#565F58]">{t(lang, 'ui_no_alerts')}</p>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-[#F7F7F1] border border-[#E2E7E1] flex items-start gap-2 text-xs"
                >
                  {alert.kind === 'warn' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#8E5312] shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-[#263C32] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-[#252D28]">{alert.title}</p>
                    <p className="text-[11px] text-[#565F58] mt-0.5">{alert.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigateSection('air-quality')}
            className="w-full py-1.5 text-xs font-medium text-[#263C32] hover:underline cursor-pointer"
          >
            {t(lang, 'tab_telemetry')}
          </button>
        </div>
      )}
    </div>
  );
}

interface HeaderProfileMenuProps {
  lang: LanguageCode;
  data: BootstrapPayload | null;
  open: boolean;
  onToggle: () => void;
  onChangeLang: (code: LanguageCode) => void;
  onNavigateSection: (target?: string) => void;
  onBackToLanding: () => void;
}

export function HeaderProfileMenu({
  lang,
  data,
  open,
  onToggle,
  onChangeLang,
  onNavigateSection,
  onBackToLanding,
}: HeaderProfileMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Household profile and language menu"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 p-1.5 pr-2.5 border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#F7F7F1] transition-colors cursor-pointer"
      >
        <span className="w-6 h-6 rounded-md bg-[#263C32] text-[#DCE9DD] flex items-center justify-center">
          <User className="w-3.5 h-3.5" />
        </span>
        <span className="hidden md:inline text-xs font-medium uppercase font-mono">{lang}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white border border-[#E2E7E1] shadow-lg p-2 z-30 text-xs space-y-1">
          <div className="px-2.5 py-2 border-b border-[#E2E7E1]">
            <p className="font-semibold text-[#252D28] truncate">
              {data?.household?.name ?? 'Local Household'}
            </p>
            <p className="text-[11px] text-[#565F58]">
              {data?.members.length ?? 0} {t(lang, 'tab_members').toLowerCase()} ·{' '}
              {data?.household?.city ?? 'Pune'}
            </p>
          </div>
          <div className="flex gap-1 px-1.5 py-1.5">
            {(['en', 'mr', 'hi'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLang(code)}
                className={`flex-1 py-1 rounded-md font-medium cursor-pointer ${
                  lang === code
                    ? 'bg-[#263C32] text-white'
                    : 'bg-[#F7F7F1] text-[#565F58] hover:text-[#252D28]'
                }`}
              >
                {code === 'en' ? 'EN' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigateSection('family')}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F7F7F1] text-[#252D28] cursor-pointer"
          >
            {t(lang, 'side_family')}
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('settings')}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F7F7F1] text-[#252D28] cursor-pointer"
          >
            {t(lang, 'side_settings')}
          </button>
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F7F7F1] text-[#565F58] cursor-pointer"
          >
            {t(lang, 'nav_backToSite')}
          </button>
        </div>
      )}
    </div>
  );
}
