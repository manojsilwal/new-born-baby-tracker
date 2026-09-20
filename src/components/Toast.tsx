// src/components/Toast.tsx
import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { RotateCcw, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useTracker();

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm"
    >
      <div className="flex items-center justify-between p-3.5 px-4 bg-slate-900/95 dark:bg-charcoal-700/95 text-white backdrop-blur-md rounded-2xl shadow-xl border border-white/10 text-xs sm:text-sm animate-fade-in">
        <span className="font-medium pr-2 truncate">{toast.message}</span>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {toast.undoAction && (
            <button
              type="button"
              onClick={() => {
                toast.undoAction?.();
                dismissToast();
              }}
              className="px-3 py-1.5 rounded-lg bg-sage-500 hover:bg-sage-600 text-white font-semibold text-xs flex items-center space-x-1 transition-colors min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{toast.undoLabel || 'Undo'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={dismissToast}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
