import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="confirm-modal-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDestructive
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white font-heading">
                  {title}
                </h3>
              </div>
            </div>
            <button
              id="btn-close-confirm-modal"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-body">
            {message}
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              id="btn-cancel-modal"
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              {cancelLabel}
            </button>
            <button
              id="btn-confirm-modal"
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl shadow-xs transition ${
                isDestructive
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
