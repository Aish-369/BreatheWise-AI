import { AlertTriangle } from 'lucide-react';
import type { LanguageCode } from '../../shared/types';
import { t } from '../../i18n/translations';

interface ConfirmClearModalProps {
  lang: LanguageCode;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmClearModal({ lang, open, onCancel, onConfirm }: ConfirmClearModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252D28]/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-clear-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E7E1] p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F6DFDC] text-[#B33A2E] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3
            id="confirm-clear-title"
            className="font-display text-base font-semibold text-[#252D28]"
          >
            {t(lang, 'ui_confirm_clear_title')}
          </h3>
        </div>
        <p className="text-xs leading-relaxed text-[#89918A]">{t(lang, 'ui_confirm_clear_desc')}</p>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium border border-[#E2E7E1] bg-white text-[#252D28] rounded-lg hover:bg-[#F7F7F1] cursor-pointer"
          >
            {t(lang, 'action_cancel')}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="px-4 py-2 text-xs font-medium bg-[#B33A2E] text-white rounded-lg hover:bg-[#962D23] cursor-pointer"
          >
            {t(lang, 'ui_confirm_delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
