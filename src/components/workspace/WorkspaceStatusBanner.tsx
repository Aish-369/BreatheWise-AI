import { X } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

interface WorkspaceActionErrorProps {
  message: string;
  onDismiss: () => void;
}

export function WorkspaceActionError({ message, onDismiss }: WorkspaceActionErrorProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#B33A2E]/35 bg-white px-4 py-3 text-sm text-[#9A2E24] shadow-sm"
    >
      <div>
        <p className="font-semibold">Action could not be completed</p>
        <p className="mt-1 text-xs leading-relaxed">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 rounded-md p-1 hover:bg-[#F6DFDC] cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface WorkspaceEmptyOrErrorProps {
  lang: LanguageCode;
  clearedEmpty: boolean;
  errorMsg: string | null;
  onRetry: () => void;
}

export function WorkspaceEmptyOrError({
  lang,
  clearedEmpty,
  errorMsg,
  onRetry,
}: WorkspaceEmptyOrErrorProps) {
  if (clearedEmpty) {
    return (
      <div className="bg-white border border-[#E2E7E1] rounded-2xl p-10 text-center space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#252D28]">
          {t(lang, 'action_clearLocal')}
        </h2>
        <p className="text-xs text-[#565F58] max-w-md mx-auto">
          {t(lang, 'ui_confirm_clear_desc')}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg hover:bg-[#1C2D25] cursor-pointer"
        >
          {t(lang, 'action_startOnboarding')}
        </button>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-white border border-[#B33A2E]/40 rounded-2xl p-6 space-y-3">
        <p className="text-sm font-medium text-[#B33A2E]">{errorMsg}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-xs font-medium bg-[#263C32] text-white rounded-lg cursor-pointer"
        >
          {t(lang, 'action_refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E7E1] rounded-2xl p-8 text-xs text-[#565F58]">
      {t(lang, 'loading')}
    </div>
  );
}
