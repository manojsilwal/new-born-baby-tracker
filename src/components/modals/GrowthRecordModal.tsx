// src/components/modals/GrowthRecordModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import {
  gramsToLbOz,
  lbOzToGrams,
  cmToInches,
  inchesToCm,
} from '../../utils/units';
import {
  X,
  Check,
  Clock,
  Trash2,
  TrendingUp,
} from 'lucide-react';

export const GrowthRecordModal: React.FC = () => {
  const {
    state,
    closeModal,
    addGrowthRecord,
    updateGrowthRecord,
    deleteGrowthRecord,
    editingGrowthRecord,
  } = useTracker();

  const isEditing = !!editingGrowthRecord;
  const weightUnit = state.settings.weightUnit;
  const lengthUnit = state.settings.lengthUnit;
  const headUnit = state.settings.headUnit;

  const [timestamp, setTimestamp] = useState(() => {
    if (editingGrowthRecord?.timestamp) return editingGrowthRecord.timestamp.slice(0, 16);
    return new Date().toISOString().slice(0, 16);
  });

  // Weight fields
  const initialLbOz = editingGrowthRecord?.weightGrams
    ? gramsToLbOz(editingGrowthRecord.weightGrams)
    : { lb: 7, oz: 8 };
  const [weightLb, setWeightLb] = useState<number>(initialLbOz.lb);
  const [weightOz, setWeightOz] = useState<number>(initialLbOz.oz);
  const [weightKg, setWeightKg] = useState<string>(
    editingGrowthRecord?.weightGrams
      ? (editingGrowthRecord.weightGrams / 1000).toFixed(2)
      : '3.40'
  );

  // Length fields
  const [lengthInput, setLengthInput] = useState<string>(() => {
    if (editingGrowthRecord?.lengthCm) {
      return lengthUnit === 'in'
        ? cmToInches(editingGrowthRecord.lengthCm).toFixed(1)
        : editingGrowthRecord.lengthCm.toFixed(1);
    }
    return lengthUnit === 'in' ? '20.0' : '50.8';
  });

  // Head circumference fields
  const [headInput, setHeadInput] = useState<string>(() => {
    if (editingGrowthRecord?.headCircumferenceCm) {
      return headUnit === 'in'
        ? cmToInches(editingGrowthRecord.headCircumferenceCm).toFixed(1)
        : editingGrowthRecord.headCircumferenceCm.toFixed(1);
    }
    return headUnit === 'in' ? '13.8' : '35.0';
  });

  const [notes, setNotes] = useState<string>(editingGrowthRecord?.notes || '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Canonical calculations
    let finalGrams: number | undefined;
    if (weightUnit === 'lb_oz') {
      finalGrams = lbOzToGrams(weightLb, weightOz);
    } else {
      const parsedKg = parseFloat(weightKg);
      if (!isNaN(parsedKg) && parsedKg > 0) finalGrams = Math.round(parsedKg * 1000);
    }

    let finalLengthCm: number | undefined;
    const parsedLength = parseFloat(lengthInput);
    if (!isNaN(parsedLength) && parsedLength > 0) {
      finalLengthCm = lengthUnit === 'in' ? inchesToCm(parsedLength) : parsedLength;
    }

    let finalHeadCm: number | undefined;
    const parsedHead = parseFloat(headInput);
    if (!isNaN(parsedHead) && parsedHead > 0) {
      finalHeadCm = headUnit === 'in' ? inchesToCm(parsedHead) : parsedHead;
    }

    const iso = new Date(timestamp).toISOString();

    if (editingGrowthRecord) {
      updateGrowthRecord({
        ...editingGrowthRecord,
        timestamp: iso,
        weightGrams: finalGrams,
        lengthCm: finalLengthCm,
        headCircumferenceCm: finalHeadCm,
        notes: notes.trim() || undefined,
      });
    } else {
      addGrowthRecord({
        timestamp: iso,
        weightGrams: finalGrams,
        lengthCm: finalLengthCm,
        headCircumferenceCm: finalHeadCm,
        notes: notes.trim() || undefined,
      });
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="growth-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 id="growth-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {isEditing ? 'Edit Growth Record' : 'Record Growth Measurement'}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-warmgray-200 dark:hover:bg-charcoal-700 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Timestamp */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Date & Time Measured
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                required
              />
              <Clock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Weight ({weightUnit === 'lb_oz' ? 'Pounds & Ounces' : 'Kilograms'})
            </label>
            {weightUnit === 'lb_oz' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    placeholder="7"
                    value={weightLb}
                    onChange={(e) => setWeightLb(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">lb</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="15.9"
                    placeholder="8.5"
                    value={weightOz}
                    onChange={(e) => setWeightOz(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">oz</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="25"
                  placeholder="3.40"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">kg</span>
              </div>
            )}
          </div>

          {/* Length & Head Circumference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Length ({lengthUnit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="120"
                  placeholder="20.0"
                  value={lengthInput}
                  onChange={(e) => setLengthInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">{lengthUnit}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Head Circ ({headUnit})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="8"
                  max="60"
                  placeholder="13.8"
                  value={headInput}
                  onChange={(e) => setHeadInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">{headUnit}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Measurement Context / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Measured at pediatrician office on infant digital scale"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            {editingGrowthRecord && (
              <button
                type="button"
                onClick={() => {
                  deleteGrowthRecord(editingGrowthRecord.id);
                  closeModal();
                }}
                className="p-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Delete record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Update Measurement' : 'Save Measurement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
