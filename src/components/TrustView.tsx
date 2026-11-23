import { CheckCircle2, Cloud, Cpu, FileSpreadsheet, Radio, Shield } from 'lucide-react';
import type { DataProviderRecord, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';
import { ProviderRegistryCard } from './trust/ProviderRegistryCard';

interface TrustViewProps {
  lang?: LanguageCode;
  providers?: DataProviderRecord[];
}

export function TrustView({ lang = 'en', providers = [] }: TrustViewProps) {
  const tiers = [
    {
      icon: Radio,
      title: t(lang, 'trust_tier_station'),
      scope: t(lang, 'trust_tier_station_scope'),
      desc: t(lang, 'trust_tier_station_desc'),
    },
    {
      icon: FileSpreadsheet,
      title: t(lang, 'trust_tier_bulletin'),
      scope: t(lang, 'trust_tier_bulletin_scope'),
      desc: t(lang, 'trust_tier_bulletin_desc'),
    },
    {
      icon: Cloud,
      title: t(lang, 'trust_tier_forecast'),
      scope: t(lang, 'trust_tier_forecast_scope'),
      desc: t(lang, 'trust_tier_forecast_desc'),
    },
    {
      icon: Cpu,
      title: t(lang, 'trust_tier_scenario'),
      scope: t(lang, 'trust_tier_scenario_scope'),
      desc: t(lang, 'trust_tier_scenario_desc'),
    },
  ];

  const boundaries = [
    t(lang, 'trust_bound_1'),
    t(lang, 'trust_bound_2'),
    t(lang, 'trust_bound_3'),
    t(lang, 'trust_bound_4'),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.title}
              className="bg-white border border-[#E2E7E1] rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-[#DCE9DD]/55 text-[#263C32] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="mt-3 font-display text-sm font-semibold text-[#252D28]">
                  {tier.title}
                </h2>
                <p className="mt-1 text-xs text-[#565F58]">{tier.desc}</p>
              </div>
              <p className="mt-4 pt-3 border-t border-[#E2E7E1] font-mono text-[11px] font-medium text-[#263C32]">
                {tier.scope}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <h2 className="font-display text-sm font-semibold text-[#252D28]">
            {t(lang, 'trust_safeguards_title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {boundaries.map((b) => (
              <div
                key={b}
                className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] flex items-start gap-2.5 text-xs text-[#252D28]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#3B6E52] shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#263C32] to-[#1D2E26] text-white p-6 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#DCE9DD]">
              <Shield className="w-4 h-4" />
              <span>{t(lang, 'trust_engine_title')}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-white leading-relaxed">
              {t(lang, 'trust_engine_desc')}
            </p>
          </div>
          <p className="mt-5 pt-3 border-t border-white/12 font-mono text-[11px] text-[#DCE9DD]">
            CPCB via data.gov.in (GODL) · OpenAQ v3 · Copernicus CAMS
          </p>
        </div>
      </div>

      <ProviderRegistryCard lang={lang} providers={providers} />
    </div>
  );
}
