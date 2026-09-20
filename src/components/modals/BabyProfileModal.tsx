// src/components/modals/BabyProfileModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { calculateBabyAge } from '../../utils/units';
import { X, Check, Baby, Calendar } from 'lucide-react';

export const BabyProfileModal: React.FC = () => {
  const { state, closeModal, updateProfile, showToast } = useTracker();
  const [name, setName] = useState<string>(state.profile.name || 'Baby');
  const [birthDate, setBirthDate] = useState<string>(state.profile.birthDate || '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Baby',
      birthDate: birthDate || '',
    });
    showToast('Baby profile updated');
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="w-full max-w-sm bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl shadow-xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-600 dark:text-sage-400 flex items-center justify-center">
              <Baby className="w-4 h-4" />
            </div>
            <h2 id="profile-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Baby Profile
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

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Baby Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Baby Maya"
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              required
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              A gentle nickname or generic default like "Baby" works great.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Birth Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              />
              <Calendar className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
            {birthDate && (
              <p className="text-xs text-sage-600 dark:text-sage-400 mt-1 font-medium">
                Current age: {calculateBabyAge(birthDate)}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors min-h-[44px] shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
