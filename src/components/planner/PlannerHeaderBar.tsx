import { RefreshCw } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';
import type { PlannerFilter } from './plannerFormReducer';

interface PlannerHeaderBarProps {
  lang: LanguageCode;
  filter: PlannerFilter;
  onSelectFilter: (filter: PlannerFilter) => void;
  onRecalculatePlan: () => void;
}

export function PlannerHeaderBar({
  lang,
  filter,
  onSelectFilter,
  onRecalculatePlan,
}: PlannerHeaderBarProps) {
  const filterTabs = [
    { id: 'all', label: t(lang, 'ui_filter_all') },
    { id: 'shifted', label: t(lang, 'ui_filter_shifted') },
    { id: 'precautions', label: t(lang, 'ui_filter_precautions') },
    { id: 'indoor', label: t(lang, 'ui_filter_indoor') },
  ] as const;

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'plan_title')}</h1>
        <p className="mt-1 text-sm text-[#565F58]">{t(lang, 'plan_subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRecalculatePlan}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[#E2E7E1] text-[#263C32] rounded-lg hover:bg-[#DCE9DD]/45 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t(lang, 'action_recalculate')}</span>
        </button>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg">
          {filterTabs.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filter === f.id ? 'bg-[#263C32] text-white' : 'text-[#565F58] hover:text-[#252D28]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
