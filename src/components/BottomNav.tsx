// src/components/BottomNav.tsx
import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { Calendar, History, HeartPulse } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useTracker();

  const tabs: { id: 'today' | 'history' | 'health'; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'health', label: 'Health', icon: HeartPulse },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-warmgray-50/95 dark:bg-charcoal-900/95 backdrop-blur-md border-t border-warmgray-200 dark:border-charcoal-800 transition-colors pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-[480px] mx-auto px-4 grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors relative focus:outline-none focus:ring-2 focus:ring-sage-500 rounded-xl min-h-[44px] ${
                isActive
                  ? 'text-sage-700 dark:text-sage-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span
                  className="absolute top-0 w-8 h-1 bg-sage-600 dark:bg-sage-400 rounded-full"
                  aria-hidden="true"
                />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
