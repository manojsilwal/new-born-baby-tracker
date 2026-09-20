// src/components/modals/HealthNoteModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { HealthNoteCategory } from '../../types/tracker';
import {
  X,
  Check,
  Clock,
  Trash2,
  FileText,
  Pill,
  Syringe,
  Activity,
  MessageSquare,
} from 'lucide-react';

const CATEGORIES: { value: HealthNoteCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'general', label: 'General Note', icon: FileText },
  { value: 'medication', label: 'Medication / Vitamin', icon: Pill },
  { value: 'vaccine', label: 'Vaccination', icon: Syringe },
  { value: 'symptom', label: 'Symptom / Behavior', icon: Activity },
  { value: 'advice', label: 'Pediatrician Advice', icon: MessageSquare },
];

export const HealthNoteModal: React.FC = () => {
  const {
    closeModal,
    addHealthNote,
    updateHealthNote,
    deleteHealthNote,
    editingHealthNote,
  } = useTracker();

  const isEditing = !!editingHealthNote;

  const [category, setCategory] = useState<HealthNoteCategory>(
    editingHealthNote?.category || 'general'
  );
  const [title, setTitle] = useState(editingHealthNote?.title || '');
  const [details, setDetails] = useState(editingHealthNote?.details || '');
  const [timestamp, setTimestamp] = useState(() => {
    if (editingHealthNote?.timestamp) return editingHealthNote.timestamp.slice(0, 16);
    return new Date().toISOString().slice(0, 16);
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) return;

    const iso = new Date(timestamp).toISOString();

    if (editingHealthNote) {
      updateHealthNote({
        ...editingHealthNote,
        category,
        title: title.trim(),
        details: details.trim(),
        timestamp: iso,
      });
    } else {
      addHealthNote({
        category,
        title: title.trim(),
        details: details.trim(),
        timestamp: iso,
      });
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-note-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-600 dark:text-sage-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 id="health-note-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {isEditing ? 'Edit Health Note' : 'Add Health & Care Note'}
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
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Note Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all min-h-[44px] ${
                      isSelected
                        ? 'border-sage-500 bg-sage-50/80 dark:bg-sage-950/40 text-sage-900 dark:text-sage-200 font-semibold ring-1 ring-sage-500'
                        : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-slate-400 hover:border-warmgray-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-sage-600 dark:text-sage-400' : 'text-slate-400'}`} />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Title / Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Started Daily Vitamin D3 Drops"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              required
            />
          </div>

          {/* Timestamp */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Date & Time
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

          {/* Details */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Details & Instructions
            </label>
            <textarea
              rows={4}
              placeholder="e.g. 400 IU (1 drop) daily in morning feed. Doctor confirmed to continue through first year."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            {editingHealthNote && (
              <button
                type="button"
                onClick={() => {
                  deleteHealthNote(editingHealthNote.id);
                  closeModal();
                }}
                className="p-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Update Note' : 'Save Health Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
