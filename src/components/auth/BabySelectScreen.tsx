// src/components/auth/BabySelectScreen.tsx
import React from 'react';
import { Baby, Plus, Shield, Users, Link2 } from 'lucide-react';
import type { AppState, MemberRole } from '../../types/tracker';

export type DiscoveredBaby = {
  familyCode: string;
  state: AppState;
  role: MemberRole;
};

type Props = {
  babies: DiscoveredBaby[];
  onSelect: (baby: DiscoveredBaby) => void;
  onAddNewborn: () => void;
  onJoinWithCode: () => void;
  loading?: boolean;
};

export const BabySelectScreen: React.FC<Props> = ({
  babies,
  onSelect,
  onAddNewborn,
  onJoinWithCode,
  loading,
}) => {
  if (loading) {
    return (
      <div className="h-[100dvh] bg-warmgray-100 dark:bg-charcoal-900 flex items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Looking up your babies…</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-y-contain bg-warmgray-100 dark:bg-charcoal-900">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8 pb-24">
      <div className="w-full max-w-[420px] bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 shadow-lg overflow-hidden">
        <div className="px-6 pt-8 pb-4 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-700 dark:text-sage-300 flex items-center justify-center">
            <Baby className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {babies.length > 0 ? 'Choose a baby' : 'Welcome'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {babies.length > 0
              ? 'Open an existing baby’s records, or add another newborn.'
              : 'Add your newborn to start tracking, or join a family with a shared code.'}
          </p>
        </div>

        <div className="px-6 pb-6 space-y-2">
          {babies.map((b) => {
            const eventCount = b.state.events?.length || 0;
            return (
              <button
                key={b.familyCode}
                type="button"
                onClick={() => onSelect(b)}
                className="w-full text-left p-4 rounded-2xl border border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:border-sage-500 transition-colors min-h-[72px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {b.state.profile.name || 'Baby'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Born {b.state.profile.birthDate || '—'}
                      {eventCount > 0 ? ` · ${eventCount} records` : ''}
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-sage-700 dark:text-sage-300 whitespace-nowrap">
                    {b.role === 'admin' ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                    {b.role === 'admin' ? 'Admin' : 'Caregiver'}
                  </span>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onAddNewborn}
            className="w-full py-3.5 mt-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Plus className="w-4 h-4" />
            Add newborn
          </button>

          <button
            type="button"
            onClick={onJoinWithCode}
            className="w-full py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 min-h-[44px] hover:bg-warmgray-100 dark:hover:bg-charcoal-800"
          >
            <Link2 className="w-3.5 h-3.5" />
            Join with family code
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
