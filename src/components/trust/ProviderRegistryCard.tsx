import { ExternalLink } from 'lucide-react';
import type { DataProviderRecord, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

interface ProviderRegistryCardProps {
  lang: LanguageCode;
  providers: DataProviderRecord[];
}

export function ProviderRegistryCard({ lang, providers }: ProviderRegistryCardProps) {
  if (providers.length === 0) return null;

  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
      <div className="px-6 py-4 border-b border-[#E2E7E1] flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-[#252D28]">
          {t(lang, 'ui_provider_registry_title')}
        </h2>
        <span className="font-mono text-xs text-[#89918A] tabular-nums">{providers.length}</span>
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
  );
}
