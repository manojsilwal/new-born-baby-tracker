// src/components/modals/DeleteBabyModal.tsx
import React, { useState } from 'react';
import { AlertTriangle, Download, Trash2, X } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';

export const DeleteBabyModal: React.FC = () => {
  const { state, closeModal, exportData, deleteBabyProfile, showToast } = useTracker();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const babyName = state.profile.name || 'this baby';
  const isAdmin = state.settings.memberRole === 'admin';

  const handleExport = () => {
    exportData();
    setExported(true);
    showToast('Backup downloaded — safe to delete when ready');
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setError('Only the admin can permanently delete this baby profile.');
      return;
    }
    setBusy(true);
    setError(null);
    const res = await deleteBabyProfile();
    setBusy(false);
    if (!res.success) {
      setError(res.error || 'Could not delete baby profile');
      return;
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-baby-title"
    >
      <div
        className="w-full max-w-sm bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl shadow-xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 id="delete-baby-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Delete baby profile
            </h2>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-full text-slate-500 hover:bg-warmgray-200 dark:hover:bg-charcoal-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Permanently remove <span className="font-semibold">{babyName}</span> and all care records
            {state.settings.familySyncCode ? ' from this device and cloud sync' : ''}. Partners using the family
            code will lose access to this baby&apos;s data.
          </p>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-medium">Export a backup before deleting (recommended).</p>
            <button
              type="button"
              onClick={handleExport}
              className="w-full py-2.5 rounded-xl bg-white dark:bg-charcoal-800 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5" />
              {exported ? 'Export again' : 'Export all data (JSON)'}
            </button>
            {exported && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Backup saved to your downloads.</p>
            )}
          </div>

          {!isAdmin && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              You are a caregiver on this baby. Ask the admin to delete the profile, or switch to another baby.
            </p>
          )}

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-warmgray-300 dark:border-charcoal-700 text-slate-700 dark:text-slate-200 text-xs font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !isAdmin}
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px] disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {busy ? 'Deleting…' : 'Delete forever'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
