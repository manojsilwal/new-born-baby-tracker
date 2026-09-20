// src/components/modals/DiaperModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { DiaperEvent, PeeColor, PoopColor, PoopConsistency } from '../../types/tracker';
import {
  X,
  Check,
  Clock,
  Trash2,
  AlertTriangle,
  Droplets,
} from 'lucide-react';

interface ColorOption<T> {
  value: T;
  label: string;
  swatchBg: string;
  swatchBorder: string;
  isAlert?: boolean;
}

const PEE_COLORS: ColorOption<PeeColor>[] = [
  { value: 'clear', label: 'Clear', swatchBg: '#f8fafc', swatchBorder: '#cbd5e1' },
  { value: 'pale-yellow', label: 'Pale Yellow (Normal)', swatchBg: '#fef08a', swatchBorder: '#facc15' },
  { value: 'dark-yellow', label: 'Dark Yellow', swatchBg: '#f59e0b', swatchBorder: '#d97706' },
  { value: 'concentrated-orange', label: 'Concentrated / Orange', swatchBg: '#ea580c', swatchBorder: '#c2410c' },
];

const POOP_COLORS: ColorOption<PoopColor>[] = [
  { value: 'mustard-yellow', label: 'Mustard Yellow', swatchBg: '#eab308', swatchBorder: '#ca8a04' },
  { value: 'brown', label: 'Brown', swatchBg: '#78350f', swatchBorder: '#451a03' },
  { value: 'dark-green', label: 'Dark Green', swatchBg: '#15803d', swatchBorder: '#166534' },
  { value: 'black', label: 'Black / Meconium', swatchBg: '#18181b', swatchBorder: '#09090b' },
  { value: 'clay-pale', label: 'Clay / Pale', swatchBg: '#e2e8f0', swatchBorder: '#94a3b8', isAlert: true },
  { value: 'blood-tinged', label: 'Blood-tinged', swatchBg: '#dc2626', swatchBorder: '#991b1b', isAlert: true },
];

const POOP_CONSISTENCIES: { value: PoopConsistency; label: string; desc: string }[] = [
  { value: 'seedy', label: 'Seedy', desc: 'Typical for breastfed' },
  { value: 'soft', label: 'Soft / Pasty', desc: 'Typical for formula' },
  { value: 'liquid', label: 'Liquid / Watery', desc: 'Very loose' },
  { value: 'hard', label: 'Hard / Formed', desc: 'Pebble-like' },
  { value: 'meconium', label: 'Meconium', desc: 'First few days' },
];

export const DiaperModal: React.FC = () => {
  const {
    closeModal,
    addEvent,
    updateEvent,
    deleteEvent,
    editingEvent,
  } = useTracker();

  const isEditing = editingEvent && editingEvent.type === 'diaper';
  const existingDiaper = isEditing ? (editingEvent as DiaperEvent) : null;

  // Diaper Mode: pee, poop, or both
  const [diaperMode, setDiaperMode] = useState<'pee' | 'poop' | 'both'>(() => {
    if (existingDiaper) {
      if (existingDiaper.hasPee && existingDiaper.hasPoop) return 'both';
      if (existingDiaper.hasPoop) return 'poop';
      return 'pee';
    }
    return 'pee';
  });

  const [timestamp, setTimestamp] = useState<string>(() => {
    if (existingDiaper?.timestamp) return existingDiaper.timestamp.slice(0, 16);
    return new Date().toISOString().slice(0, 16);
  });

  // Pee values
  const [peeColor, setPeeColor] = useState<PeeColor>(existingDiaper?.peeColor || 'pale-yellow');

  // Poop values
  const [poopConsistency, setPoopConsistency] = useState<PoopConsistency>(
    existingDiaper?.poopConsistency || 'seedy'
  );
  const [poopColor, setPoopColor] = useState<PoopColor>(
    existingDiaper?.poopColor || 'mustard-yellow'
  );

  // Safety acknowledgment for alert poop colors
  const isClayAlert = poopColor === 'clay-pale';
  const isBloodAlert = poopColor === 'blood-tinged';
  const requiresAlertAcknowledgment = (diaperMode === 'poop' || diaperMode === 'both') && (isClayAlert || isBloodAlert);

  const [alertAcknowledged, setAlertAcknowledged] = useState<boolean>(
    existingDiaper?.alertAcknowledged || false
  );

  const [note, setNote] = useState<string>(existingDiaper?.note || '');

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (requiresAlertAcknowledgment && !alertAcknowledged) {
      return;
    }

    const iso = new Date(timestamp).toISOString();
    const hasPee = diaperMode === 'pee' || diaperMode === 'both';
    const hasPoop = diaperMode === 'poop' || diaperMode === 'both';

    if (existingDiaper) {
      updateEvent({
        ...existingDiaper,
        timestamp: iso,
        hasPee,
        peeColor: hasPee ? peeColor : undefined,
        hasPoop,
        poopConsistency: hasPoop ? poopConsistency : undefined,
        poopColor: hasPoop ? poopColor : undefined,
        alertAcknowledged: requiresAlertAcknowledgment ? alertAcknowledged : false,
        note: note.trim() || undefined,
      });
    } else {
      addEvent({
        type: 'diaper',
        timestamp: iso,
        hasPee,
        peeColor: hasPee ? peeColor : undefined,
        hasPoop,
        poopConsistency: hasPoop ? poopConsistency : undefined,
        poopColor: hasPoop ? poopColor : undefined,
        alertAcknowledged: requiresAlertAcknowledgment ? alertAcknowledged : false,
        note: note.trim() || undefined,
      });
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diaper-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <h2 id="diaper-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {existingDiaper ? 'Edit Diaper' : 'Log Diaper'}
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-warmgray-200 dark:hover:bg-charcoal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diaper Type Segmented Control */}
        <div className="p-4 border-b border-warmgray-200 dark:border-charcoal-700">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-warmgray-200/70 dark:bg-charcoal-800 rounded-xl">
            <button
              type="button"
              onClick={() => setDiaperMode('pee')}
              className={`py-2 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[44px] flex items-center justify-center ${
                diaperMode === 'pee'
                  ? 'bg-white dark:bg-charcoal-700 text-amber-700 dark:text-amber-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Wet (Pee)
            </button>
            <button
              type="button"
              onClick={() => setDiaperMode('poop')}
              className={`py-2 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[44px] flex items-center justify-center ${
                diaperMode === 'poop'
                  ? 'bg-white dark:bg-charcoal-700 text-amber-700 dark:text-amber-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Dirty (Poop)
            </button>
            <button
              type="button"
              onClick={() => setDiaperMode('both')}
              className={`py-2 px-3 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[44px] flex items-center justify-center ${
                diaperMode === 'both'
                  ? 'bg-white dark:bg-charcoal-700 text-amber-700 dark:text-amber-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Both (Pee + Poop)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5">
          {/* Timestamp */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Time
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

          {/* PEE SECTION */}
          {(diaperMode === 'pee' || diaperMode === 'both') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pee Color
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PEE_COLORS.map((opt) => {
                  const isSelected = peeColor === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPeeColor(opt.value)}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all min-h-[44px] ${
                        isSelected
                          ? 'border-sage-500 bg-sage-50/70 dark:bg-sage-950/40 ring-1 ring-sage-500'
                          : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-warmgray-300'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: opt.swatchBg, border: `1px solid ${opt.swatchBorder}` }}
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex-1">
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* POOP SECTION */}
          {(diaperMode === 'poop' || diaperMode === 'both') && (
            <div className="space-y-4 pt-1">
              {/* Consistency */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Poop Consistency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POOP_CONSISTENCIES.map((c) => {
                    const isSelected = poopConsistency === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setPoopConsistency(c.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
                          isSelected
                            ? 'border-sage-500 bg-sage-50/70 dark:bg-sage-950/40 ring-1 ring-sage-500'
                            : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-warmgray-300'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                          <span>{c.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {c.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Poop Color
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {POOP_COLORS.map((opt) => {
                    const isSelected = poopColor === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setPoopColor(opt.value);
                          if (opt.isAlert) {
                            setAlertAcknowledged(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all min-h-[44px] ${
                          isSelected
                            ? opt.isAlert
                              ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 ring-1 ring-rose-500'
                              : 'border-sage-500 bg-sage-50/70 dark:bg-sage-950/40 ring-1 ring-sage-500'
                            : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-warmgray-300'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: opt.swatchBg, border: `1px solid ${opt.swatchBorder}` }}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex-1">
                          {opt.label}
                        </span>
                        {opt.isAlert && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />}
                        {isSelected && !opt.isAlert && (
                          <Check className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HIGH-PRIORITY RED SAFETY ALERTS */}
              {isClayAlert && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-3"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold text-rose-900 dark:text-rose-100 text-sm mb-1">
                        Prompt Medical Guidance Required
                      </p>
                      <p>
                        Pale or clay-colored stool can warrant prompt medical attention. Contact your baby’s
                        pediatrician or an appropriate medical service for guidance.
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1.5">
                        This tracker does not diagnose conditions. If your baby exhibits extreme distress, lethargy,
                        fever, or you have immediate concerns, seek emergency medical care.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2.5 pt-1 text-xs font-medium text-rose-900 dark:text-rose-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertAcknowledged}
                      onChange={(e) => setAlertAcknowledged(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-rose-400 cursor-pointer"
                      required
                    />
                    <span>I have read and acknowledged this medical guidance notice.</span>
                  </label>
                </div>
              )}

              {isBloodAlert && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-3"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-semibold text-rose-900 dark:text-rose-100 text-sm mb-1">
                        Prompt Medical Discussion Advised
                      </p>
                      <p>
                        Blood in a newborn’s stool should be discussed promptly with a qualified healthcare
                        professional.
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1.5">
                        This application is an informational tracking tool and does not provide diagnosis. If your
                        infant appears unwell or shows severe symptoms, contact emergency healthcare immediately.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2.5 pt-1 text-xs font-medium text-rose-900 dark:text-rose-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertAcknowledged}
                      onChange={(e) => setAlertAcknowledged(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-rose-400 cursor-pointer"
                      required
                    />
                    <span>I have read and acknowledged this medical guidance notice.</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Diaper cream applied, small amount"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            {existingDiaper && (
              <button
                type="button"
                onClick={() => {
                  deleteEvent(existingDiaper.id);
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
              disabled={requiresAlertAcknowledgment && !alertAcknowledged}
              className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>{existingDiaper ? 'Update Diaper Record' : 'Save Diaper Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
