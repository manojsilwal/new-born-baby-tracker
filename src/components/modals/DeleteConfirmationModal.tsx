// src/components/modals/DeleteConfirmationModal.tsx
import React, { useEffect } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-charcoal-850 rounded-3xl shadow-2xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2 id="delete-dialog-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>

        <p id="delete-dialog-desc" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-warmgray-300 dark:border-charcoal-700 text-slate-700 dark:text-slate-300 hover:bg-warmgray-100 dark:hover:bg-charcoal-700 text-xs font-medium transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors min-h-[44px] flex items-center justify-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
