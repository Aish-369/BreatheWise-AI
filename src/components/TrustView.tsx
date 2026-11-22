import { CheckCircle2, Cloud, Cpu, ExternalLink, FileSpreadsheet, Radio, Shield } from 'lucide-react';
import type { DataProviderRecord, LanguageCode } from '../shared/types';
import { t } from '../i18n/translations';

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
                <p className="mt-1 text-xs text-[#89918A]">{tier.desc}</p>
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

      {providers.length > 0 && (
        <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              {t(lang, 'ui_provider_registry_title')}
            </h2>
            <span className="font-mono text-xs text-[#89918A] tabular-nums">
              {providers.length}
            </span>
          </div>
          <div className="divide-y divide-[#E2E7E1]">
            {providers.map((prov) => (
              <div key={prov.id} className="p-5 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm font-semibold text-[#252D28]">{prov.name}</h3>
                    <p className="font-mono text-[11px] text-[#89918A]">{prov.baseUrl}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#F7F7F1] border border-[#E2E7E1] font-mono text-[11px] text-[#263C32]">
                    {prov.status}
                  </span>
                </div>
                <p className="text-[#89918A]">{prov.notes}</p>
                {prov.licenses.map((lic) => (
                  <div
                    key={lic.id}
                    className="p-3 rounded-xl bg-[#F7F7F1] border border-[#E2E7E1] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-[#252D28]">{lic.licenseName}</p>
                      <p className="text-[11px] text-[#89918A]">{lic.attributionText}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E2E7E1] text-[10px] text-[#263C32]">
                        {lic.commercialAllowed
                          ? t(lang, 'ui_license_commercial_yes')
                          : t(lang, 'ui_license_commercial_no')}
                      </span>
                      {lic.licenseUrl && (
                        <a
                          href={lic.licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#263C32] hover:underline"
                        >
                          <span>License</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
