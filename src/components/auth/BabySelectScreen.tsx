// src/components/auth/BabySelectScreen.tsx
import React from 'react';
import { Baby, Shield, Users } from 'lucide-react';
import type { AppState, MemberRole } from '../../types/tracker';

export type DiscoveredBaby = {
  familyCode: string;
  state: AppState;
  role: MemberRole;
};

type Props = {
  babies: DiscoveredBaby[];
  onSelect: (baby: DiscoveredBaby) => void;
  onCreateNew: () => void;
  loading?: boolean;
};

export const BabySelectScreen: React.FC<Props> = ({ babies, onSelect, onCreateNew, loading }) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-warmgray-100 dark:bg-charcoal-900 flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Looking up your babies…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warmgray-100 dark:bg-charcoal-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 shadow-lg overflow-hidden">
        <div className="px-6 pt-8 pb-4 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-700 dark:text-sage-300 flex items-center justify-center">
            <Baby className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Your babies</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a shared baby linked to your account, or set up a new one.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-2">
          {babies.map((b) => (
            <button
              key={b.familyCode}
              type="button"
              onClick={() => onSelect(b)}
              className="w-full text-left p-4 rounded-2xl border border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-sage-500 transition-colors min-h-[64px]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {b.state.profile.name || 'Baby'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Born {b.state.profile.birthDate || '—'} · code {b.familyCode}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-sage-700 dark:text-sage-300 whitespace-nowrap">
                  {b.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                  {b.role === 'admin' ? 'Admin' : 'Caregiver'}
                </span>
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={onCreateNew}
            className="w-full py-3 mt-2 rounded-xl border border-dashed border-warmgray-300 dark:border-charcoal-600 text-xs font-medium text-slate-600 dark:text-slate-300 min-h-[44px]"
          >
            Set up a different baby
          </button>
        </div>
      </div>
    </div>
  );
};
