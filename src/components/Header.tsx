// src/components/Header.tsx
import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { calculateBabyAge, formatWeekdayDate } from '../utils/units';
import { Settings, Baby, Moon, Sun, Cloud, RefreshCw } from 'lucide-react';

export const Header: React.FC = () => {
  const { state, activeTab, openModal, updateSettings, syncStatus, showBabyPicker } = useTracker();
  const todayStr = formatWeekdayDate(new Date().toISOString());
  const babyName = state.profile.name || 'Baby';
  const babyAge = calculateBabyAge(state.profile.birthDate);
  const isCloudSynced = !!state.settings.familySyncCode;

  const toggleTheme = () => {
    const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 bg-warmgray-50/90 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-warmgray-200 dark:border-charcoal-800 transition-colors">
      <div className="max-w-[480px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: App Title & Date or Baby Age */}
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-500 inline-block" />
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Newborn Tracker
            </h1>
            {isCloudSynced && (
              <span
                className="flex items-center space-x-1 text-[10px] text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-sage-950/60 px-1.5 py-0.5 rounded-md border border-sage-200 dark:border-sage-900"
                title={`Cloud storage active (Family code: ${state.settings.familySyncCode})`}
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-sage-600" />
                ) : (
                  <Cloud className="w-2.5 h-2.5 text-sage-600 dark:text-sage-400" />
                )}
                <span>Cloud</span>
              </span>
            )}
          </div>
          {activeTab === 'today' ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {todayStr}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
              {activeTab} Overview
            </p>
          )}
        </div>

        {/* Right: Baby Chip + Theme Toggle + Settings */}
        <div className="flex items-center space-x-1.5">
          {/* Baby chip — tap to switch / add another */}
          <button
            type="button"
            onClick={() => showBabyPicker()}
            className="flex items-center space-x-1.5 py-1.5 px-3 rounded-full bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-slate-700 dark:text-slate-200 hover:border-sage-400 transition-all text-xs font-medium shadow-2xs min-h-[38px] max-w-[140px]"
            aria-label={`Switch baby. Current: ${babyName}${babyAge ? `, ${babyAge}` : ''}`}
            title="Switch baby or add newborn"
          >
            <Baby className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400 flex-shrink-0" />
            <span className="truncate">{babyName}</span>
            {babyAge && (
              <span className="text-[10px] text-slate-400 hidden sm:inline truncate">
                • {babyAge}
              </span>
            )}
          </button>

          {/* Quick Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-warmgray-200/80 dark:hover:bg-charcoal-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label={`Switch to ${state.settings.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {state.settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => openModal('settings')}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-warmgray-200/80 dark:hover:bg-charcoal-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
