// src/components/ActiveTimerBanner.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import { getActiveNursingTotals, formatDurationMmSs } from '../utils/units';
import {
  Baby,
  Moon,
  Play,
  Pause,
  ArrowLeftRight,
  Square,
  Check,
} from 'lucide-react';

export const ActiveTimerBanner: React.FC = () => {
  const {
    state,
    openModal,
    pauseNursing,
    resumeNursing,
    switchNursingSide,
    finishAndSaveNursing,
    finishAndSaveSleep,
  } = useTracker();

  const activeNursing = state.activeTimers.nursing;
  const activeSleep = state.activeTimers.sleep;

  // Live timer tick
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if ((activeNursing && !activeNursing.isPaused) || activeSleep) {
      const interval = setInterval(() => setNowTick(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [activeNursing, activeSleep]);

  if (!activeNursing && !activeSleep) return null;

  // Nursing timer calculations
  const nursingTotals = getActiveNursingTotals(activeNursing, nowTick);

  // Sleep timer calculations
  const sleepSeconds = activeSleep
    ? Math.max(0, Math.floor((nowTick - new Date(activeSleep.startedAt).getTime()) / 1000))
    : 0;

  return (
    <div className="space-y-2 mb-4 animate-fade-in">
      {/* Active Nursing Session Banner */}
      {activeNursing && (
        <div className="bg-sage-50 dark:bg-charcoal-800 border border-sage-200 dark:border-charcoal-700 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => openModal('feed')}
              className="flex items-center space-x-2.5 text-left flex-1 min-w-0 pr-2 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-sage-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                <Baby className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-xs text-sage-900 dark:text-sage-200">
                    Nursing ({activeNursing.activeSide || 'Left'})
                  </span>
                  {activeNursing.isPaused && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold">
                      Paused
                    </span>
                  )}
                </div>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {formatDurationMmSs(nursingTotals.totalSeconds)}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  L: {formatDurationMmSs(nursingTotals.leftSeconds)} • R: {formatDurationMmSs(nursingTotals.rightSeconds)}
                </span>
              </div>
            </button>

            {/* Quick action buttons */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={switchNursingSide}
                className="p-2 rounded-xl bg-white dark:bg-charcoal-700 border border-warmgray-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 hover:bg-warmgray-50 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                title="Switch nursing side"
                aria-label="Switch breast side"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeNursing.isPaused) resumeNursing();
                  else pauseNursing();
                }}
                className="p-2 rounded-xl bg-white dark:bg-charcoal-700 border border-warmgray-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 hover:bg-warmgray-50 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                aria-label={activeNursing.isPaused ? 'Resume timer' : 'Pause timer'}
              >
                {activeNursing.isPaused ? (
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                )}
              </button>
              <button
                type="button"
                onClick={() => finishAndSaveNursing()}
                className="px-3 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-xs flex items-center space-x-1 min-h-[40px] shadow-xs transition-colors"
                aria-label="Save nursing session"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Sleep Session Banner */}
      {activeSleep && (
        <div className="bg-indigo-50/90 dark:bg-charcoal-800 border border-indigo-200 dark:border-charcoal-700 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => openModal('sleep')}
              className="flex items-center space-x-2.5 text-left flex-1 min-w-0 pr-2 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                <Moon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-indigo-950 dark:text-indigo-200 block">
                  Baby Is Sleeping
                </span>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {formatDurationMmSs(sleepSeconds)}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  Started at {new Date(activeSleep.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => finishAndSaveSleep()}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center space-x-1.5 min-h-[40px] shadow-xs transition-colors flex-shrink-0"
              aria-label="Wake up and save sleep session"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Wake Up</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
