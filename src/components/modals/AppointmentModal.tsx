// src/components/modals/AppointmentModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import {
  X,
  Check,
  Calendar,
  Clock,
  Plus,
  Trash2,
  MapPin,
  User,
  HelpCircle,
} from 'lucide-react';

export const AppointmentModal: React.FC = () => {
  const {
    closeModal,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    editingAppointment,
  } = useTracker();

  const isEditing = !!editingAppointment;

  const [title, setTitle] = useState(editingAppointment?.title || '');
  const [providerName, setProviderName] = useState(editingAppointment?.providerName || '');
  const [dateTime, setDateTime] = useState(() => {
    if (editingAppointment?.dateTime) return editingAppointment.dateTime.slice(0, 16);
    // default tomorrow at 10:00 AM
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [location, setLocation] = useState(editingAppointment?.location || '');
  const [questions, setQuestions] = useState<string[]>(
    editingAppointment?.questions && editingAppointment.questions.length > 0
      ? editingAppointment.questions
      : ['']
  );
  const [providerInstructions, setProviderInstructions] = useState(
    editingAppointment?.providerInstructions || ''
  );
  const [isCompleted, setIsCompleted] = useState(editingAppointment?.isCompleted || false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, '']);
  };

  const handleUpdateQuestion = (index: number, val: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !providerName.trim() || !dateTime) return;

    const filteredQuestions = questions.map((q) => q.trim()).filter(Boolean);
    const isoDateTime = new Date(dateTime).toISOString();

    if (editingAppointment) {
      updateAppointment({
        ...editingAppointment,
        title: title.trim(),
        providerName: providerName.trim(),
        dateTime: isoDateTime,
        location: location.trim() || undefined,
        questions: filteredQuestions,
        providerInstructions: providerInstructions.trim() || undefined,
        isCompleted,
      });
    } else {
      addAppointment({
        title: title.trim(),
        providerName: providerName.trim(),
        dateTime: isoDateTime,
        location: location.trim() || undefined,
        questions: filteredQuestions,
        providerInstructions: providerInstructions.trim() || undefined,
        isCompleted,
      });
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-600 dark:text-sage-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 id="appointment-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {isEditing ? 'Edit Appointment' : 'New Pediatric Visit'}
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
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Visit Reason / Title
            </label>
            <input
              type="text"
              placeholder="e.g. 2-Week Well-Child Checkup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Doctor / Provider
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Dr. Jenkins, MD"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                  required
                />
                <User className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                  required
                />
                <Clock className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Clinic Location (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Cedar Valley Pediatrics, Suite 210"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              />
              <MapPin className="w-4 h-4 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Questions to ask */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5 text-sage-600" />
                <span>Questions for the Pediatrician</span>
              </label>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs text-sage-600 dark:text-sage-400 font-medium hover:underline flex items-center space-x-0.5 p-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add question</span>
              </button>
            </div>
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder={`Question ${idx + 1}...`}
                    value={q}
                    onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[38px]"
                  />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      aria-label="Remove question"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Provider instructions / notes after visit */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Doctor Instructions / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Next visit at 1 month. Continue Vitamin D drops. Sponge baths until stump separates."
              value={providerInstructions}
              onChange={(e) => setProviderInstructions(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"
            />
          </div>

          {/* Status check */}
          <label className="flex items-center space-x-2.5 pt-1 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500 border-warmgray-300"
            />
            <span>Mark as Completed Visit</span>
          </label>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            {editingAppointment && (
              <button
                type="button"
                onClick={() => {
                  deleteAppointment(editingAppointment.id);
                  closeModal();
                }}
                className="p-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Delete appointment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Update Appointment' : 'Save Appointment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
