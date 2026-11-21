import { useState } from 'react';
import { Bike, Clock, Home, Plus, Sun, Trash2 } from 'lucide-react';
import type {
  ActivityRoutine,
  ActivityRoutineInput,
  FamilyMember,
  ForecastSlot,
  LanguageCode,
  ProtectionPlanResult,
  TimeWindow,
} from '../shared/types';
import { t } from '../i18n/translations';

interface PlannerViewProps {
  lang: LanguageCode;
  members: FamilyMember[];
  routines: ActivityRoutine[];
  plan: ProtectionPlanResult;
  forecasts: ForecastSlot[];
  onAddRoutine: (input: ActivityRoutineInput) => Promise<void>;
  onDeleteRoutine: (routineId: string) => Promise<void>;
}

const TIME_WINDOWS: TimeWindow[] = [
  '06:00-09:00',
  '09:00-12:00',
  '12:00-16:00',
  '16:00-19:00',
  '19:00-22:00',
];

function statusStyle(status: string): string {
  switch (status) {
    case 'proceed_as_planned':
      return 'bg-[#DCE9DD]/75 text-[#263C32]';
    case 'adjust_window':
      return 'bg-[#263C32] text-white';
    case 'proceed_with_precautions':
      return 'bg-[#F5EBD8] text-[#8E5312]';
    default:
      return 'bg-[#F6DFDC] text-[#9A2E24]';
  }
}

export function PlannerView({
  lang,
  members,
  routines,
  plan,
  forecasts,
  onAddRoutine,
  onDeleteRoutine,
}: PlannerViewProps) {
  const [title, setTitle] = useState('');
  const [environment, setEnvironment] = useState<'outdoor' | 'indoor'>('outdoor');
  const [flexibility, setFlexibility] = useState<'fixed' | 'flexible'>('flexible');
  const [preferredWindow, setPreferredWindow] = useState<TimeWindow>('06:00-09:00');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    members.slice(0, 1).map((m) => m.id)
  );
  const [filter, setFilter] = useState<'all' | 'shifted' | 'precautions' | 'indoor'>('all');
  const [submitting, setSubmitting] = useState(false);

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyTemplate = (
    tplTitle: string,
    tplEnv: 'outdoor' | 'indoor',
    tplFlex: 'fixed' | 'flexible',
    tplWindow: TimeWindow
  ) => {
    setTitle(tplTitle);
    setEnvironment(tplEnv);
    setFlexibility(tplFlex);
    setPreferredWindow(tplWindow);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedMemberIds.length === 0) return;
    setSubmitting(true);
    try {
      await onAddRoutine({
        title: title.trim(),
        environment,
        flexibility,
        preferredWindow,
        memberIds: selectedMemberIds,
      });
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlan = plan.dailyPlan.filter((item) => {
    if (filter === 'shifted') return item.status === 'adjust_window' || item.status === 'move_indoors';
    if (filter === 'precautions') return item.status === 'proceed_with_precautions';
    if (filter === 'indoor') return item.environment === 'indoor';
    return true;
  });

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#252D28]">{t(lang, 'plan_title')}</h1>
          <p className="mt-1 text-sm text-[#89918A]">{t(lang, 'plan_subtitle')}</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 bg-white border border-[#E2E7E1] rounded-lg shrink-0">
          {(
            [
              { id: 'all', label: t(lang, 'ui_filter_all') },
              { id: 'shifted', label: t(lang, 'ui_filter_shifted') },
              { id: 'precautions', label: t(lang, 'ui_filter_precautions') },
              { id: 'indoor', label: t(lang, 'ui_filter_indoor') },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filter === f.id
                  ? 'bg-[#263C32] text-white'
                  : 'text-[#89918A] hover:text-[#252D28]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive 5-Window Day Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TIME_WINDOWS.map((win) => {
          const itemsInWindow = plan.dailyPlan.filter(
            (i) => (i.suggestedWindow ?? i.originalWindow) === win
          );
          const forecastMatch = forecasts.find((f) => f.timeWindow === win);
          return (
            <div
              key={win}
              className="bg-white border border-[#E2E7E1] rounded-xl p-3.5 shadow-[0_1px_3px_rgba(37,45,40,0.03)]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#252D28] tabular-nums">{win}</span>
                <span className="font-mono text-[11px] text-[#89918A] tabular-nums">
                  {itemsInWindow.length}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#89918A]">
                {forecastMatch?.expectedPm25
                  ? `Est. PM2.5 ~${forecastMatch.expectedPm25} µg`
                  : 'No forecast slot'}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Timeline */}
        <div className="lg:col-span-7 bg-white border border-[#E2E7E1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(37,45,40,0.04)]">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E2E7E1]">
            <h2 className="font-display text-sm font-semibold text-[#252D28]">
              Daily Schedule Timeline
            </h2>
            <span className="font-mono text-xs text-[#89918A] tabular-nums">
              {routines.length} routines
            </span>
          </div>

          {filteredPlan.length === 0 ? (
            <p className="py-6 text-xs text-[#89918A]">
              No routines match this filter. Adjust filter or add a routine.
            </p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-[#E2E7E1]">
              {filteredPlan.map((item) => {
                const EnvIcon =
                  item.environment === 'indoor' ? Home : item.suggestedWindow ? Sun : Bike;
                return (
                  <div key={item.routineId} className="relative">
                    <span className="absolute -left-6 top-2 w-4 h-4 rounded-full bg-white border-2 border-[#263C32]" />
                    <div className="rounded-xl border border-[#E2E7E1] bg-[#F7F7F1]/55 p-4 hover:bg-white transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <EnvIcon className="w-4 h-4 text-[#263C32] shrink-0" />
                            <h3 className="text-sm font-semibold text-[#252D28]">
                              {item.routineTitle}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#89918A]">
                            <span className="inline-flex items-center gap-1 font-mono text-[#252D28] tabular-nums">
                              <Clock className="w-3 h-3 text-[#829C83]" />
                              {item.suggestedWindow
                                ? `${item.originalWindow} → ${item.suggestedWindow}`
                                : item.originalWindow}
                            </span>
                            <span>·</span>
                            <span>
                              {t(lang, `env_${item.environment}`)} ·{' '}
                              {t(lang, `flex_${item.flexibility}`)} ·{' '}
                              {item.applicableMembers.join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${statusStyle(
                              item.status
                            )}`}
                          >
                            {t(lang, `status_${item.status}`)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteRoutine(item.routineId)}
                            aria-label={`Remove ${item.routineTitle}`}
                            className="p-1.5 rounded-lg text-[#89918A] hover:text-[#B33A2E] hover:bg-[#F7F7F1] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-[#252D28]">
                        {t(lang, item.rationaleKey, item.rationaleParams)}
                      </p>
                      {item.limitationKey && (
                        <p className="mt-1 text-[11px] text-[#B4691E]">
                          {t(lang, `lim_${item.limitationKey}`)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Activity Form + Quick Templates */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-[#E2E7E1] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(37,45,40,0.04)]"
        >
          <h2 className="font-display text-sm font-semibold text-[#252D28] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#829C83]" strokeWidth={1.8} />
            <span>Add Household Routine</span>
          </h2>

          {/* Quick Templates */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Morning Walk', env: 'outdoor' as const, flex: 'flexible' as const, win: '06:00-09:00' as const },
              { label: 'School Run', env: 'outdoor' as const, flex: 'fixed' as const, win: '06:00-09:00' as const },
              { label: 'Evening Play', env: 'outdoor' as const, flex: 'flexible' as const, win: '16:00-19:00' as const },
              { label: 'Indoor Yoga', env: 'indoor' as const, flex: 'flexible' as const, win: '09:00-12:00' as const },
            ].map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl.label, tpl.env, tpl.flex, tpl.win)}
                className="px-2.5 py-1 text-[11px] font-medium bg-[#F7F7F1] border border-[#E2E7E1] rounded-md text-[#252D28] hover:bg-[#DCE9DD]/50 cursor-pointer"
              >
                + {tpl.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-[#89918A] mb-1">Activity Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Evening badminton practice"
              className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#89918A] mb-1">Setting</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as 'outdoor' | 'indoor')}
                className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
              >
                <option value="outdoor">{t(lang, 'env_outdoor')}</option>
                <option value="indoor">{t(lang, 'env_indoor')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#89918A] mb-1">Flexibility</label>
              <select
                value={flexibility}
                onChange={(e) => setFlexibility(e.target.value as 'fixed' | 'flexible')}
                className="w-full px-3 py-2 text-sm bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
              >
                <option value="flexible">{t(lang, 'flex_flexible')}</option>
                <option value="fixed">{t(lang, 'flex_fixed')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#89918A] mb-1">Preferred Time Window</label>
            <select
              value={preferredWindow}
              onChange={(e) => setPreferredWindow(e.target.value as TimeWindow)}
              className="w-full px-3 py-2 text-sm font-mono bg-[#F7F7F1] border border-[#E2E7E1] rounded-lg"
            >
              {TIME_WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#89918A] mb-1.5">Family Members</label>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => {
                const active = selectedMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#263C32] text-white border-[#263C32]'
                        : 'bg-[#F7F7F1] text-[#89918A] border-[#E2E7E1] hover:text-[#252D28]'
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || selectedMemberIds.length === 0}
            className="w-full px-4 py-2.5 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] disabled:opacity-50 cursor-pointer"
          >
            {t(lang, 'action_add')}
          </button>
        </form>
      </div>
    </div>
  );
}
