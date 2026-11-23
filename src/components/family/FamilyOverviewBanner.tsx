import { MapPin, ShieldCheck } from 'lucide-react';
import type { HouseholdProfile, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

interface FamilyOverviewBannerProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  memberCount: number;
  flexibleCount: number;
  fixedCount: number;
}

export function FamilyOverviewBanner({
  lang,
  household,
  memberCount,
  flexibleCount,
  fixedCount,
}: FamilyOverviewBannerProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#263C32] via-[#2F4A3D] to-[#21352C] text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-[0_10px_28px_rgba(38,60,50,0.12)]">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#DCE9DD]">
          <ShieldCheck className="w-4 h-4" />
          <span>Local SQLite Profile · No medical or personal IDs stored</span>
        </div>
        <h2 className="font-display text-xl font-bold text-white">{household.name}</h2>
        <p className="inline-flex items-center gap-1.5 text-xs text-[#DCE9DD]">
          <MapPin className="w-3.5 h-3.5" />
          <span>
            {household.city}
            {household.locality ? ` · ${household.locality}` : ''}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
          <p className="font-mono text-xl font-bold tabular-nums">{memberCount}</p>
          <p className="text-[11px] text-[#DCE9DD]">{t(lang, 'tab_members')}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
          <p className="font-mono text-xl font-bold tabular-nums">{flexibleCount}</p>
          <p className="text-[11px] text-[#DCE9DD]">{t(lang, 'flex_flexible')}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
          <p className="font-mono text-xl font-bold tabular-nums">{fixedCount}</p>
          <p className="text-[11px] text-[#DCE9DD]">{t(lang, 'flex_fixed')}</p>
        </div>
      </div>
    </div>
  );
}
