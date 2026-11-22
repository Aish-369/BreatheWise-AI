import { useState } from 'react';
import { AlertTriangle, Globe, ShieldCheck, WifiOff } from 'lucide-react';
import type { DataProviderRecord, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';
import { TrustView } from './TrustView';

interface SettingsViewProps {
  lang: LanguageCode;
  simulateOutage: boolean;
  useDemoFixtures: boolean;
  providers: DataProviderRecord[];
  initialSubTab?: 'preferences' | 'methodology';
  onChangeLang: (lang: LanguageCode) => void;
  onToggleOutage: (next: boolean) => void;
  onToggleDemoFixtures: (next: boolean) => void;
  onClearLocal: () => Promise<void>;
}

export function SettingsView({
  lang,
  simulateOutage,
  useDemoFixtures,
  providers,
  initialSubTab = 'preferences',
  onChangeLang,
  onToggleOutage,
  onToggleDemoFixtures,
  onClearLocal,
}: SettingsViewProps) {
  const [subTab, setSubTab] = useState<'preferences' | 'methodology'>(initialSubTab);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">
            {t(lang, 'settings_title')}
          </h1>
          <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'settings_subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('preferences')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'preferences'
                ? 'bg-[#263C32] text-white'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_preferences')}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('methodology')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'methodology'
                ? 'bg-[#263C32] text-white'
                : 'text-[#89918A] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_methodology')}
          </button>
        </div>
      </div>

      {subTab === 'methodology' ? (
        <TrustView lang={lang} providers={providers} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-sm font-semibold text-[#252D28]">Language</h2>
                  <p className="mt-0.5 text-xs text-[#89918A]">
                    Applies across navigation, recommendations, planner, and PDFs.
                  </p>
                </div>
              </div>
            </div>

            <div className="inline-flex w-full items-center gap-1 p-1 bg-[#F7F7F1] border border-[#E2E7E1] rounded-xl">
              {(['en', 'mr', 'hi'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChangeLang(code)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    lang === code
                      ? 'bg-[#263C32] text-white'
                      : 'text-[#89918A] hover:text-[#252D28]'
                  }`}
                >
                  {code === 'en' ? 'English' : code === 'mr' ? 'मराठी' : 'हिन्दी'}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E2E7E1] bg-[#F7F7F1] p-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#DCE9DD] text-[#263C32] flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#252D28]">Illustrative environmental data</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#89918A]">
                    Show clearly labelled synthetic AQI, pollutant and forecast samples when live providers have no data. Verified live readings always take priority.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-pressed={useDemoFixtures}
                onClick={() => onToggleDemoFixtures(!useDemoFixtures)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  useDemoFixtures
                    ? 'bg-[#263C32] text-white border-[#263C32]'
                    : 'bg-white text-[#252D28] border-[#E2E7E1]'
                }`}
              >
                {useDemoFixtures ? 'On' : 'Off'}
              </button>
            </div>

            <div className="pt-4 border-t border-[#E2E7E1] space-y-4">
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#E2E7E1]">
                <div className="flex items-start gap-3">
                  <WifiOff className="w-4 h-4 text-[#B33A2E] mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#252D28]">
                      {t(lang, 'outage_mode_label')}
                    </h3>
                    <p className="text-xs text-[#89918A]">
                      Verify unavailable-data safeguards without fabricating readings.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={simulateOutage}
                  onClick={() => onToggleOutage(!simulateOutage)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-colors shrink-0 cursor-pointer ${
                    simulateOutage
                      ? 'bg-[#B33A2E] text-white border-[#B33A2E]'
                      : 'bg-[#F7F7F1] text-[#252D28] border-[#E2E7E1]'
                  }`}
                >
                  {simulateOutage ? t(lang, 'on') : t(lang, 'off')}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-5 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-[#252D28]">
                  Local Data Privacy Vault
                </h2>
                <p className="mt-0.5 text-xs text-[#89918A]">
                  Household profiles, activity schedules, and history live strictly in local SQLite.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="px-4 py-2 text-xs font-medium border border-[#B33A2E]/35 bg-white text-[#B33A2E] rounded-lg hover:bg-[#B33A2E]/5 cursor-pointer"
              >
                {t(lang, 'action_clearLocal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmClearOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252D28]/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E7E1] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F6DFDC] text-[#B33A2E] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#252D28]">
                {t(lang, 'ui_confirm_clear_title')}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-[#89918A]">
              {t(lang, 'ui_confirm_clear_desc')}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#F7F7F1] cursor-pointer"
              >
                {t(lang, 'action_cancel')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmClearOpen(false);
                  await onClearLocal();
                }}
                className="px-4 py-2 text-xs font-medium bg-[#B33A2E] text-white rounded-lg hover:bg-[#962D23] cursor-pointer"
              >
                {t(lang, 'ui_confirm_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
