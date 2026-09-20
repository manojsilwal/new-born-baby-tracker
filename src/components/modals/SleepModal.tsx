// src/components/modals/SleepModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { SleepEvent } from '../../types/tracker';
import { formatDuration, formatDurationMmSs } from '../../utils/units';
import {
  X,
  Play,
  Square,
  Check,
  Clock,
  Moon,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const SleepModal: React.FC = () => {
  const {
    state,
    closeModal,
    addEvent,
    updateEvent,
    deleteEvent,
    editingEvent,
    startSleep,
    finishAndSaveSleep,
    cancelSleep,
  } = useTracker();

  const isEditing = editingEvent && editingEvent.type === 'sleep';
  const existingSleep = isEditing ? (editingEvent as SleepEvent) : null;
  const activeSleep = state.activeTimers.sleep;

  // Mode: timer or manual
  const [mode, setMode] = useState<'timer' | 'manual'>(() => {
    if (existingSleep) return 'manual';
    if (activeSleep) return 'timer';
    return 'timer';
  });

  // Live timer tick for active sleep
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if (activeSleep) {
      const interval = setInterval(() => setNowTick(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [activeSleep]);

  const activeElapsedSeconds = activeSleep
    ? Math.max(0, Math.floor((nowTick - new Date(activeSleep.startedAt).getTime()) / 1000))
    : 0;

  // Manual Form State
  const [startTime, setStartTime] = useState<string>(() => {
    if (existingSleep?.startTime) return existingSleep.startTime.slice(0, 16);
    // Default 1 hour ago
    return new Date(Date.now() - 3600 * 1000).toISOString().slice(0, 16);
  });

  const [endTime, setEndTime] = useState<string>(() => {
    if (existingSleep?.endTime) return existingSleep.endTime.slice(0, 16);
    return new Date().toISOString().slice(0, 16);
  });

  const [note, setNote] = useState<string>(existingSleep?.note || '');
  const [activeNote, setActiveNote] = useState<string>('');

  // Calculate duration for manual entry
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const manualDurationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const isInvalidTime = endMs <= startMs;

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalidTime || manualDurationSeconds < 1) return;

    const startIso = new Date(startTime).toISOString();
    const endIso = new Date(endTime).toISOString();

    /**
     * Cross-midnight sleep handling:
     * We store the exact ISO start and end timestamps so exact duration is preserved.
     * For daily summaries and 7-day aggregation, events are attributed to their start date.
     */
    if (existingSleep) {
      updateEvent({
        ...existingSleep,
        startTime: startIso,
        endTime: endIso,
        durationSeconds: manualDurationSeconds,
        note: note.trim() || undefined,
      });
    } else {
      addEvent({
        type: 'sleep',
        startTime: startIso,
        endTime: endIso,
        durationSeconds: manualDurationSeconds,
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
      aria-labelledby="sleep-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <h2 id="sleep-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {existingSleep ? 'Edit Sleep Record' : 'Track Sleep'}
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

        {/* Mode Selector (Live Timer vs Manual Entry) */}
        {!existingSleep && (
          <div className="p-4 border-b border-warmgray-200 dark:border-charcoal-700">
            <div className="grid grid-cols-2 gap-2 p-1 bg-warmgray-200/70 dark:bg-charcoal-800 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('timer')}
                className={`py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
                  mode === 'timer'
                    ? 'bg-white dark:bg-charcoal-700 text-indigo-700 dark:text-indigo-300 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Live Sleep Timer</span>
                {activeSleep && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" aria-label="Timer running" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
                  mode === 'manual'
                    ? 'bg-white dark:bg-charcoal-700 text-indigo-700 dark:text-indigo-300 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Manual Entry</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {mode === 'timer' && !existingSleep ? (
            /* LIVE TIMER MODE */
            <div className="space-y-5 text-center">
              <div className="py-6 px-4 bg-warmgray-100 dark:bg-charcoal-800 rounded-2xl border border-warmgray-200 dark:border-charcoal-700">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  {activeSleep ? 'Baby Is Currently Sleeping' : 'Ready to Track Sleep'}
                </span>
                <div className="text-5xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
                  {activeSleep ? formatDurationMmSs(activeElapsedSeconds) : '00:00'}
                </div>
                {activeSleep ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Started at {new Date(activeSleep.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Tap Start when putting baby down to sleep
                  </p>
                )}
              </div>

              {activeSleep ? (
                <div className="space-y-4">
                  {/* Optional Note while sleeping */}
                  <div className="text-left">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Sleep Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Swaddled, white noise on"
                      value={activeNote}
                      onChange={(e) => setActiveNote(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>

                  {/* Stop and Save or Cancel */}
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={cancelSleep}
                      className="py-3 px-4 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-sm font-medium transition-colors min-h-[44px]"
                    >
                      Cancel Timer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        finishAndSaveSleep(activeNote);
                        closeModal();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors min-h-[44px] shadow-sm"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Wake Up & Save Sleep</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={startSleep}
                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base flex items-center justify-center space-x-2 transition-all shadow-md min-h-[48px]"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Start Sleep Timer</span>
                  </button>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    The timer continues running even if you close the app or browser.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* MANUAL ENTRY OR EDITING EXISTING SLEEP */
            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Time (Fell Asleep)
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                    required
                  />
                  <Clock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  End Time (Woke Up)
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 min-h-[44px] ${
                      isInvalidTime
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-warmgray-300 dark:border-charcoal-700 focus:ring-sage-500'
                    }`}
                    required
                  />
                  <Clock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
                {isInvalidTime && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>End time must be after start time.</span>
                  </p>
                )}
              </div>

              {/* Calculated Live Duration Display */}
              <div className="p-3 bg-warmgray-100 dark:bg-charcoal-800 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Calculated Sleep Duration:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {!isInvalidTime ? formatDuration(manualDurationSeconds) : '--'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Slept in crib, needed pacifier once"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                {existingSleep && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteEvent(existingSleep.id);
                      closeModal();
                    }}
                    className="p-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Delete sleep record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isInvalidTime || manualDurationSeconds < 1}
                  className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  <span>{existingSleep ? 'Update Sleep Record' : 'Save Sleep Record'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
