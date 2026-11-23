import { useState } from 'react';
import type { DataProviderRecord, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';
import { TrustView } from './TrustView';
import { PreferencesPanel } from './settings/PreferencesPanel';
import { ConfirmClearModal } from './settings/ConfirmClearModal';

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
          <p className="mt-1 text-sm text-[#525C56]">{t(lang, 'settings_subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
          <button
            type="button"
            aria-pressed={subTab === 'preferences'}
            onClick={() => setSubTab('preferences')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'preferences'
                ? 'bg-[#263C32] text-white'
                : 'text-[#525C56] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_preferences')}
          </button>
          <button
            type="button"
            aria-pressed={subTab === 'methodology'}
            onClick={() => setSubTab('methodology')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              subTab === 'methodology'
                ? 'bg-[#263C32] text-white'
                : 'text-[#525C56] hover:text-[#252D28]'
            }`}
          >
            {t(lang, 'tab_methodology')}
          </button>
        </div>
      </div>

      {subTab === 'methodology' ? (
        <TrustView lang={lang} providers={providers} />
      ) : (
        <PreferencesPanel
          lang={lang}
          simulateOutage={simulateOutage}
          useDemoFixtures={useDemoFixtures}
          onChangeLang={onChangeLang}
          onToggleOutage={onToggleOutage}
          onToggleDemoFixtures={onToggleDemoFixtures}
          onRequestClear={() => setConfirmClearOpen(true)}
        />
      )}

      <ConfirmClearModal
        lang={lang}
        open={confirmClearOpen}
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={async () => {
          setConfirmClearOpen(false);
          await onClearLocal();
        }}
      />
    </div>
  );
}
