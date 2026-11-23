import { motion } from 'motion/react';
import type {
  EnvironmentalSnapshot,
  HouseholdProfile,
  LanguageCode,
  ProtectionPlanResult,
} from '../../shared/types';
import { t } from '../../i18n/translations';
import { AqiGauge } from '../AqiGauge';
import { bandIndexPercent } from './dashboardHelpers';

interface DashboardHeroCardProps {
  lang: LanguageCode;
  household: HouseholdProfile;
  plan: ProtectionPlanResult;
  primarySnapshot: EnvironmentalSnapshot;
}

export function DashboardHeroCard({
  lang,
  household,
  plan,
  primarySnapshot,
}: DashboardHeroCardProps) {
  const classificationKey = `cls_${plan.classification ?? (plan.isDemoFixture ? 'demo_fixture' : plan.isAvailable ? 'verified_live' : 'unavailable')}`;

  return (
    <div
      aria-live="polite"
      className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-[#263C32] via-[#2E493C] to-[#1A2B23] text-white p-6 lg:p-7 shadow-[0_12px_32px_rgba(38,60,50,0.14)] flex flex-col justify-between relative overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#DCE9DD]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-white/12 text-white font-medium text-[11px]">
            {t(lang, classificationKey)}
          </span>
          <span>
            {t(lang, 'dash_aqi_label')} · {t(lang, `dtype_${plan.dataType}`)}
          </span>
        </div>
        <span className="font-mono tabular-nums text-white/90">
          {t(lang, `fresh_${plan.freshness}`)}
        </span>
      </div>

      <div className="my-5 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        <div className="sm:col-span-5 flex justify-center">
          <AqiGauge
            aqi={plan.aqiValue}
            band={plan.aqiBand}
            bandLabel={t(lang, `band_${plan.aqiBand}`)}
            isAvailable={plan.isAvailable}
            darkSurface
            size="lg"
          />
        </div>

        <div className="sm:col-span-7 space-y-4">
          {plan.isAvailable && plan.aqiValue !== null ? (
            <>
              <div>
                <p className="font-display text-lg font-semibold text-white">
                  {plan.city}
                  {household.locality ? ` · ${household.locality}` : ''}
                </p>
                <p className="text-xs text-[#DCE9DD]">
                  {plan.aqiIsDerived ? t(lang, 'dash_derived_note') : t(lang, 'dash_reported_note')}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-[#DCE9DD]">
                  <span>{t(lang, 'ui_aqi_scale_label')}</span>
                  <span className="tabular-nums">0 — 450+</span>
                </div>
                <div className="relative h-2 w-full rounded-full overflow-hidden flex">
                  <div className="flex-1 bg-[#489C6E]" />
                  <div className="flex-1 bg-[#829C83]" />
                  <div className="flex-1 bg-[#D99B38]" />
                  <div className="flex-1 bg-[#D96B38]" />
                  <div className="flex-1 bg-[#C94438]" />
                  <div className="flex-1 bg-[#9E2323]" />
                  <motion.div
                    initial={{ left: '0%' }}
                    animate={{ left: `${bandIndexPercent(plan.aqiValue)}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#263C32] shadow-sm"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="font-display text-lg font-semibold text-white">
                {t(lang, 'dash_unavailable_title')}
              </p>
              <p className="text-xs text-[#DCE9DD] leading-relaxed">
                {t(lang, 'dash_unavailable_desc')}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-white/12 grid grid-cols-3 gap-3 text-xs">
        <div className="min-w-0">
          <span className="block text-[11px] text-[#DCE9DD]">{t(lang, 'dash_source')}</span>
          <span className="font-medium text-white truncate block">
            {primarySnapshot.providerLabel}
          </span>
        </div>
        <div>
          <span className="block text-[11px] text-[#DCE9DD]/75">{t(lang, 'dash_dominant')}</span>
          <span className="font-mono font-medium text-white">{plan.dominantPollutant ?? '—'}</span>
        </div>
        <div>
          <span className="block text-[11px] text-[#DCE9DD]/75">{t(lang, 'dash_measured_at')}</span>
          <span className="font-mono tabular-nums font-medium text-white">
            {primarySnapshot.measuredAt
              ? new Date(primarySnapshot.measuredAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
