import { CheckCircle2, Cloud, Cpu, FileSpreadsheet, Radio, Shield } from 'lucide-react';

export function TrustView() {
  const tiers = [
    {
      icon: Radio,
      title: 'Physical Monitoring Station',
      scope: 'Station perimeter only',
      desc: 'CPCB CAAQMS or OpenAQ ground monitors.',
    },
    {
      icon: FileSpreadsheet,
      title: 'City Bulletin',
      scope: 'Municipal aggregate',
      desc: 'Regional summaries that may lag traffic peaks.',
    },
    {
      icon: Cloud,
      title: 'Modeled & Coarse Forecast',
      scope: '~40 km atmospheric grid',
      desc: 'Copernicus CAMS regional trends; never street-level.',
    },
    {
      icon: Cpu,
      title: 'Hypothetical Scenario',
      scope: 'Non-observed simulation',
      desc: 'User-configured What-If overrides only.',
    },
  ];

  const boundaries = [
    'No medical diagnosis or clinical prescriptions',
    'No unverified street-level safety guarantees',
    'Stale (> 6h) or missing forecasts pause timing shifts openly',
    'Provider outages never fall back to disguised mock values',
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
            Safeguard Commitments
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
              <span>Deterministic Engine & Licenses</span>
            </div>
            <p className="mt-3 text-sm font-medium text-white leading-relaxed">
              Calculated locally via India CPCB NAQI sub-indices, freshness thresholds (≤ 2h Fresh, 2–6h Aging, &gt; 6h Stale), and routine flexibility rules.
            </p>
          </div>
          <p className="mt-5 pt-3 border-t border-white/12 font-mono text-[11px] text-[#DCE9DD]">
            CPCB via data.gov.in (GODL) · OpenAQ v3 · Copernicus CAMS
          </p>
        </div>
      </div>
    </div>
  );
}
