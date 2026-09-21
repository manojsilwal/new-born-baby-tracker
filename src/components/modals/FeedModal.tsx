// src/components/modals/FeedModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { BottleType, FeedType, FeedingEvent, NursingSide } from '../../types/tracker';
import {
  formatDurationMmSs,
  getActiveNursingTotals,
  mlToOz,
  ozToMl,
  getConvertedVolumeSubtext,
  toDatetimeLocalValue,
} from '../../utils/units';
import {
  X,
  Play,
  Pause,
  ArrowLeftRight,
  Check,
  Milk,
  Baby,
  Clock,
  Trash2,
  Edit3,
} from 'lucide-react';

export const FeedModal: React.FC = () => {
  const {
    state,
    closeModal,
    addEvent,
    updateEvent,
    deleteEvent,
    editingEvent,
    startNursing,
    pauseNursing,
    resumeNursing,
    switchNursingSide,
    finishAndSaveNursing,
    cancelNursing,
    getLastNursingSide,
  } = useTracker();

  const isEditing = editingEvent && editingEvent.type === 'feeding';
  const existingFeed = isEditing ? (editingEvent as FeedingEvent) : null;

  // Active nursing session from state
  const activeNursing = state.activeTimers.nursing;

  // Local state for tabs: nursing vs bottle
  const [feedType, setFeedType] = useState<FeedType>(
    existingFeed ? existingFeed.feedType : activeNursing ? 'nursing' : 'nursing'
  );

  // Manual logging mode for nursing (when adding past feed or editing)
  const [isManualNursing, setIsManualNursing] = useState<boolean>(
    existingFeed ? existingFeed.feedType === 'nursing' : false
  );

  // Live timer tick for active nursing
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if (activeNursing && !activeNursing.isPaused) {
      const interval = setInterval(() => setNowTick(Date.now()), 500);
      return () => clearInterval(interval);
    }
  }, [activeNursing]);

  // Totals for active nursing session
  const activeTotals = getActiveNursingTotals(activeNursing, nowTick);

  // Manual Nursing form state
  const [nursingStartTime, setNursingStartTime] = useState<string>(() =>
    toDatetimeLocalValue(existingFeed?.startTime || new Date())
  );
  const [leftMinutes, setLeftMinutes] = useState<number>(() => {
    if (existingFeed?.leftDurationSeconds) return Math.round(existingFeed.leftDurationSeconds / 60);
    return 10;
  });
  const [rightMinutes, setRightMinutes] = useState<number>(() => {
    if (existingFeed?.rightDurationSeconds) return Math.round(existingFeed.rightDurationSeconds / 60);
    return 10;
  });
  const [nursingNote, setNursingNote] = useState<string>(existingFeed?.note || '');

  // Bottle form state
  const [bottleStartTime, setBottleStartTime] = useState<string>(() =>
    toDatetimeLocalValue(existingFeed?.startTime || new Date())
  );
  const [bottleType, setBottleType] = useState<BottleType>(() => {
    if (existingFeed?.bottleType) return existingFeed.bottleType;
    return 'expressed';
  });
  const [volumeUnit, setVolumeUnit] = useState<'oz' | 'ml'>(state.settings.bottleUnit);

  // Volume in primary unit
  const [volumeInput, setVolumeInput] = useState<number>(() => {
    if (existingFeed?.volumeMl) {
      return state.settings.bottleUnit === 'oz' ? mlToOz(existingFeed.volumeMl) : existingFeed.volumeMl;
    }
    return state.settings.bottleUnit === 'oz' ? 2.5 : 75;
  });
  const [bottleNote, setBottleNote] = useState<string>(existingFeed?.note || '');

  // Compute canonical volume in ml
  const currentVolumeMl = volumeUnit === 'oz' ? ozToMl(volumeInput) : volumeInput;

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  // Handlers for Bottle adjustments
  const adjustVolume = (delta: number) => {
    setVolumeInput((prev) => {
      const next = Math.max(0, Math.round((prev + delta) * 10) / 10);
      return next;
    });
  };

  const handleSaveBottle = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentVolumeMl <= 0) return;

    const startIso = new Date(bottleStartTime).toISOString();

    if (existingFeed) {
      updateEvent({
        ...existingFeed,
        feedType: 'bottle',
        startTime: startIso,
        volumeMl: currentVolumeMl,
        bottleType,
        note: bottleNote.trim() || undefined,
        leftDurationSeconds: undefined,
        rightDurationSeconds: undefined,
        totalDurationSeconds: undefined,
        lastActiveSide: undefined,
      });
    } else {
      addEvent({
        type: 'feeding',
        feedType: 'bottle',
        startTime: startIso,
        endTime: startIso,
        volumeMl: currentVolumeMl,
        bottleType,
        note: bottleNote.trim() || undefined,
      });
    }
    closeModal();
  };

  // Handlers for Manual Nursing Save
  const handleSaveManualNursing = (e: React.FormEvent) => {
    e.preventDefault();
    const leftSec = Math.max(0, leftMinutes * 60);
    const rightSec = Math.max(0, rightMinutes * 60);
    const totalSec = leftSec + rightSec;

    if (totalSec < 1) return;

    const startIso = new Date(nursingStartTime).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + totalSec * 1000).toISOString();
    const lastSide: NursingSide = rightSec > 0 ? 'right' : 'left';

    if (existingFeed) {
      updateEvent({
        ...existingFeed,
        feedType: 'nursing',
        startTime: startIso,
        endTime: endIso,
        leftDurationSeconds: leftSec,
        rightDurationSeconds: rightSec,
        totalDurationSeconds: totalSec,
        lastActiveSide: lastSide,
        note: nursingNote.trim() || undefined,
        volumeMl: undefined,
        bottleType: undefined,
      });
    } else {
      addEvent({
        type: 'feeding',
        feedType: 'nursing',
        startTime: startIso,
        endTime: endIso,
        leftDurationSeconds: leftSec,
        rightDurationSeconds: rightSec,
        totalDurationSeconds: totalSec,
        lastActiveSide: lastSide,
        note: nursingNote.trim() || undefined,
      });
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feed-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-600 dark:text-sage-400 flex items-center justify-center">
              <Baby className="w-4 h-4" />
            </div>
            <h2 id="feed-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {existingFeed ? 'Edit Feeding' : 'Log Feeding'}
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

        {/* Mode Selector (Nursing vs Bottle) */}
        {!existingFeed && (
          <div className="p-4 border-b border-warmgray-200 dark:border-charcoal-700">
            <div className="grid grid-cols-2 gap-2 p-1 bg-warmgray-200/70 dark:bg-charcoal-800 rounded-xl">
              <button
                type="button"
                onClick={() => setFeedType('nursing')}
                className={`py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
                  feedType === 'nursing'
                    ? 'bg-white dark:bg-charcoal-700 text-sage-700 dark:text-sage-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Baby className="w-4 h-4" />
                <span>Nursing</span>
                {activeNursing && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" aria-label="Timer running" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setFeedType('bottle')}
                className={`py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
                  feedType === 'bottle'
                    ? 'bg-white dark:bg-charcoal-700 text-sage-700 dark:text-sage-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Milk className="w-4 h-4" />
                <span>Bottle</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {feedType === 'nursing' ? (
            /* ================= NURSING SECTION ================= */
            <div>
              {!isManualNursing && !existingFeed ? (
                /* LIVE NURSING TIMER */
                <div className="space-y-5">
                  {/* Total Duration Banner */}
                  <div className="bg-warmgray-100 dark:bg-charcoal-800 rounded-2xl p-4 text-center border border-warmgray-200 dark:border-charcoal-700">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                      Total Nursing Time
                    </span>
                    <div className="text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {formatDurationMmSs(activeTotals.totalSeconds)}
                    </div>
                    {activeNursing && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Current side:{' '}
                        <span className="font-semibold text-sage-600 dark:text-sage-400 capitalize">
                          {activeNursing.isPaused ? `${activeNursing.activeSide} (Paused)` : activeNursing.activeSide}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Left and Right Breast Timer Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* LEFT BREAST */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeNursing) {
                          startNursing('left');
                        } else if (activeNursing.activeSide === 'left') {
                          if (activeNursing.isPaused) resumeNursing('left');
                          else pauseNursing();
                        } else {
                          switchNursingSide();
                        }
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all min-h-[120px] flex flex-col justify-between ${
                        activeNursing?.activeSide === 'left' && !activeNursing.isPaused
                          ? 'border-sage-500 bg-sage-50/80 dark:bg-sage-950/40 ring-2 ring-sage-400'
                          : activeNursing?.activeSide === 'left' && activeNursing.isPaused
                          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
                          : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-warmgray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Left Breast</span>
                        {activeNursing?.activeSide === 'left' && !activeNursing.isPaused ? (
                          <span className="p-1.5 rounded-full bg-sage-600 text-white">
                            <Pause className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-full bg-warmgray-200 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300">
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatDurationMmSs(activeTotals.leftSeconds)}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {activeNursing?.activeSide === 'left'
                          ? activeNursing.isPaused
                            ? 'Paused'
                            : 'Nursing...'
                          : 'Tap to start Left'}
                      </span>
                    </button>

                    {/* RIGHT BREAST */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!activeNursing) {
                          startNursing('right');
                        } else if (activeNursing.activeSide === 'right') {
                          if (activeNursing.isPaused) resumeNursing('right');
                          else pauseNursing();
                        } else {
                          switchNursingSide();
                        }
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all min-h-[120px] flex flex-col justify-between ${
                        activeNursing?.activeSide === 'right' && !activeNursing.isPaused
                          ? 'border-sage-500 bg-sage-50/80 dark:bg-sage-950/40 ring-2 ring-sage-400'
                          : activeNursing?.activeSide === 'right' && activeNursing.isPaused
                          ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30'
                          : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-warmgray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Right Breast</span>
                        {activeNursing?.activeSide === 'right' && !activeNursing.isPaused ? (
                          <span className="p-1.5 rounded-full bg-sage-600 text-white">
                            <Pause className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1.5 rounded-full bg-warmgray-200 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300">
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatDurationMmSs(activeTotals.rightSeconds)}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {activeNursing?.activeSide === 'right'
                          ? activeNursing.isPaused
                            ? 'Paused'
                            : 'Nursing...'
                          : 'Tap to start Right'}
                      </span>
                    </button>
                  </div>

                  {/* Actions when timer is running / paused */}
                  {activeNursing ? (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={switchNursingSide}
                          className="py-3 px-4 rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-700 dark:text-slate-200 font-medium text-sm flex items-center justify-center space-x-2 hover:bg-warmgray-50 min-h-[44px]"
                        >
                          <ArrowLeftRight className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                          <span>Switch Side</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (activeNursing.isPaused) resumeNursing();
                            else pauseNursing();
                          }}
                          className="py-3 px-4 rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-700 dark:text-slate-200 font-medium text-sm flex items-center justify-center space-x-2 hover:bg-warmgray-50 min-h-[44px]"
                        >
                          {activeNursing.isPaused ? (
                            <>
                              <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Pause</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Optional Note */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Session Note (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Good latch, burped once"
                          value={nursingNote}
                          onChange={(e) => setNursingNote(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500"
                        />
                      </div>

                      {/* Finish & Save or Cancel */}
                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={cancelNursing}
                          className="py-3 px-4 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-sm font-medium transition-colors min-h-[44px]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            finishAndSaveNursing(nursingNote);
                            closeModal();
                          }}
                          disabled={activeTotals.totalSeconds < 1}
                          className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 min-h-[44px] shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          <span>Finish & Save Feed</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Initial prompt when timer not yet started */
                    <div className="text-center pt-1 pb-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Last feed finished on opposite side. Suggested side:{' '}
                        <span className="font-semibold text-sage-700 dark:text-sage-400 uppercase">
                          {getLastNursingSide()}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsManualNursing(true)}
                        className="text-xs text-sage-600 dark:text-sage-400 hover:underline flex items-center justify-center mx-auto space-x-1 py-2 min-h-[44px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Log previous nursing feed manually</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* MANUAL NURSING FORM / EDITING EXISTING NURSING */
                <form onSubmit={handleSaveManualNursing} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Start Time
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={nursingStartTime}
                        onChange={(e) => setNursingStartTime(e.target.value)}
                        className="w-full px-3 py-2 pr-10 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px] [color-scheme:light] dark:[color-scheme:dark]"
                        required
                      />
                      <Clock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Left Duration (mins)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={leftMinutes}
                        onChange={(e) => setLeftMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Right Duration (mins)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={rightMinutes}
                        onChange={(e) => setRightMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-warmgray-100 dark:bg-charcoal-800 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Total Nursing Time:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {leftMinutes + rightMinutes} mins
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Good latch, burped easily"
                      value={nursingNote}
                      onChange={(e) => setNursingNote(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    {!existingFeed && (
                      <button
                        type="button"
                        onClick={() => setIsManualNursing(false)}
                        className="py-3 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-warmgray-100 dark:hover:bg-charcoal-700 text-sm font-medium min-h-[44px]"
                      >
                        Back to Timer
                      </button>
                    )}
                    {existingFeed && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteEvent(existingFeed.id);
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
                      disabled={leftMinutes + rightMinutes <= 0}
                      className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 min-h-[44px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>{existingFeed ? 'Update Nursing Record' : 'Save Nursing Record'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ================= BOTTLE SECTION ================= */
            <form onSubmit={handleSaveBottle} className="space-y-4">
              {/* Bottle Type: Expressed Milk vs Formula */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Bottle Contents
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBottleType('expressed')}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
                      bottleType === 'expressed'
                        ? 'border-sage-500 bg-sage-100 dark:bg-sage-900 text-sage-900 dark:text-sage-100 font-semibold'
                        : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>Expressed Milk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBottleType('formula')}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border flex items-center justify-center space-x-2 transition-all min-h-[44px] ${
                      bottleType === 'formula'
                        ? 'border-sage-500 bg-sage-100 dark:bg-sage-900 text-sage-900 dark:text-sage-100 font-semibold'
                        : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>Formula</span>
                  </button>
                </div>
              </div>

              {/* Volume Controls */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Amount</label>
                  {/* Unit toggle */}
                  <div className="flex items-center bg-warmgray-200 dark:bg-charcoal-800 rounded-lg p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        if (volumeUnit !== 'oz') {
                          setVolumeUnit('oz');
                          setVolumeInput(mlToOz(volumeInput));
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        volumeUnit === 'oz'
                          ? 'bg-white dark:bg-charcoal-700 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      oz
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (volumeUnit !== 'ml') {
                          setVolumeUnit('ml');
                          setVolumeInput(ozToMl(volumeInput));
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        volumeUnit === 'ml'
                          ? 'bg-white dark:bg-charcoal-700 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      ml
                    </button>
                  </div>
                </div>

                {/* Primary Stepper & Input */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => adjustVolume(volumeUnit === 'oz' ? -0.5 : -10)}
                    className="w-12 h-12 rounded-xl bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 font-bold text-lg flex items-center justify-center hover:bg-warmgray-300 dark:hover:bg-charcoal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
                    aria-label={`Decrease by ${volumeUnit === 'oz' ? '0.5 oz' : '10 ml'}`}
                  >
                    -
                  </button>
                  <div className="flex-1 text-center bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 rounded-xl py-2 px-3">
                    <input
                      type="number"
                      step={volumeUnit === 'oz' ? '0.1' : '1'}
                      min="0"
                      max="500"
                      value={volumeInput || ''}
                      onChange={(e) => setVolumeInput(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-center font-mono font-bold text-2xl text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {volumeUnit} ({getConvertedVolumeSubtext(currentVolumeMl, volumeUnit)})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustVolume(volumeUnit === 'oz' ? 0.5 : 10)}
                    className="w-12 h-12 rounded-xl bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 font-bold text-lg flex items-center justify-center hover:bg-warmgray-300 dark:hover:bg-charcoal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
                    aria-label={`Increase by ${volumeUnit === 'oz' ? '0.5 oz' : '10 ml'}`}
                  >
                    +
                  </button>
                </div>

                {/* Quick amount chips */}
                <div className="flex items-center space-x-1.5 mt-2 overflow-x-auto py-1">
                  {(volumeUnit === 'oz' ? [1, 2, 2.5, 3, 4] : [30, 60, 75, 90, 120]).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setVolumeInput(amt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all min-h-[36px] whitespace-nowrap ${
                        volumeInput === amt
                          ? 'border-sage-500 bg-sage-100 dark:bg-sage-900 text-sage-900 dark:text-sage-100 font-semibold'
                          : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {amt} {volumeUnit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Time Inline Adjustment */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Time of Feed
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={bottleStartTime}
                    onChange={(e) => setBottleStartTime(e.target.value)}
                    className="w-full px-3 py-2 pr-10 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px] [color-scheme:light] dark:[color-scheme:dark]"
                    required
                  />
                  <Clock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finished all, burped nicely"
                  value={bottleNote}
                  onChange={(e) => setBottleNote(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              {/* Save & Delete actions */}
              <div className="flex items-center space-x-2 pt-2">
                {existingFeed && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteEvent(existingFeed.id);
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
                  disabled={currentVolumeMl <= 0}
                  className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  <span>{existingFeed ? 'Update Bottle Feed' : 'Save Bottle Feed'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
