import { Bike, CheckCircle2, Circle, Clock, Home, Pencil, Sun, Trash2 } from 'lucide-react';
import type { DailyPlanItem, LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

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

interface RoutineDisplayCardProps {
  lang: LanguageCode;
  item: DailyPlanItem;
  onStartEdit: (routineId: string) => void;
  onToggleCompletion: (routineId: string, completed: boolean) => Promise<void>;
  onDeleteRoutine: (routineId: string) => Promise<void>;
}

export function RoutineDisplayCard({
  lang,
  item,
  onStartEdit,
  onToggleCompletion,
  onDeleteRoutine,
}: RoutineDisplayCardProps) {
  const EnvIcon = item.environment === 'indoor' ? Home : item.suggestedWindow ? Sun : Bike;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <EnvIcon className="w-4 h-4 text-[#263C32] shrink-0" />
            <h3
              className={`text-sm font-semibold ${
                item.completedToday ? 'line-through text-[#565F58]' : 'text-[#252D28]'
              }`}
            >
              {item.routineTitle}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#565F58]">
            <span className="inline-flex items-center gap-1 font-mono text-[#252D28] tabular-nums">
              <Clock className="w-3 h-3 text-[#4D6B50]" />
              {item.suggestedWindow
                ? `${item.originalWindow} → ${item.suggestedWindow}`
                : item.originalWindow}
            </span>
            <span>·</span>
            <span>
              {t(lang, `env_${item.environment}`)} · {t(lang, `flex_${item.flexibility}`)} ·{' '}
              {item.applicableMembers.join(', ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${statusStyle(
              item.status
            )}`}
          >
            {t(lang, `status_${item.status}`)}
          </span>
          <button
            type="button"
            onClick={() => void onToggleCompletion(item.routineId, !item.completedToday)}
            title={
              item.completedToday ? t(lang, 'ui_completed_today') : t(lang, 'ui_mark_completed')
            }
            aria-label={
              item.completedToday ? t(lang, 'ui_completed_today') : t(lang, 'ui_mark_completed')
            }
            className="p-1.5 rounded-lg text-[#263C32] hover:bg-[#DCE9DD]/50 cursor-pointer"
          >
            {item.completedToday ? (
              <CheckCircle2 className="w-4 h-4 text-[#3B6E52]" />
            ) : (
              <Circle className="w-4 h-4 text-[#565F58]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onStartEdit(item.routineId)}
            aria-label={`${t(lang, 'action_edit')} ${item.routineTitle}`}
            className="p-1.5 rounded-lg text-[#565F58] hover:text-[#263C32] hover:bg-[#F7F7F1] cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void onDeleteRoutine(item.routineId)}
            aria-label={`Remove ${item.routineTitle}`}
            className="p-1.5 rounded-lg text-[#565F58] hover:text-[#B33A2E] hover:bg-[#F7F7F1] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-[#252D28]">
        {t(lang, item.rationaleKey, item.rationaleParams)}
      </p>
      {item.notes && <p className="mt-1 text-[11px] italic text-[#565F58]">{item.notes}</p>}
      {item.limitationKey && (
        <p className="mt-1 text-[11px] text-[#8E5312]">{t(lang, `lim_${item.limitationKey}`)}</p>
      )}
    </>
  );
}
