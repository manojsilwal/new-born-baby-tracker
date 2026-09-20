// src/components/health/HealthView.tsx
import React, { useState, useMemo } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { HealthNoteCategory } from '../../types/tracker';
import {
  formatDate,
  formatDateTime,
  formatWeight,
  formatLength,
} from '../../utils/units';
import {
  Calendar,
  TrendingUp,
  FileText,
  Plus,
  CheckCircle2,
  Circle,
  MapPin,
  User,
  HelpCircle,
  Edit2,
  Trash2,
  Pill,
  Syringe,
  Activity,
  MessageSquare,
} from 'lucide-react';

export const HealthView: React.FC = () => {
  const {
    state,
    openModal,
    setEditingAppointment,
    deleteAppointment,
    toggleAppointmentComplete,
    setEditingGrowthRecord,
    deleteGrowthRecord,
    setEditingHealthNote,
    deleteHealthNote,
  } = useTracker();

  const [subTab, setSubTab] = useState<'appointments' | 'growth' | 'notes'>('appointments');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>('all');

  // Sorted Appointments
  const sortedAppointments = useMemo(() => {
    return [...state.appointments].sort((a, b) => {
      // Pending first, then by date
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
    });
  }, [state.appointments]);

  // Growth records with delta calculations
  const growthWithDeltas = useMemo(() => {
    const list = [...state.growthRecords].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return list.map((record, index) => {
      const prev = index < list.length - 1 ? list[index + 1] : null;
      let weightDeltaGrams: number | null = null;
      let lengthDeltaCm: number | null = null;

      if (prev && record.weightGrams && prev.weightGrams) {
        weightDeltaGrams = record.weightGrams - prev.weightGrams;
      }
      if (prev && record.lengthCm && prev.lengthCm) {
        lengthDeltaCm = Math.round((record.lengthCm - prev.lengthCm) * 10) / 10;
      }

      return {
        ...record,
        weightDeltaGrams,
        lengthDeltaCm,
      };
    });
  }, [state.growthRecords]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    let list = [...state.healthNotes].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (noteCategoryFilter !== 'all') {
      list = list.filter((n) => n.category === noteCategoryFilter);
    }
    return list;
  }, [state.healthNotes, noteCategoryFilter]);

  const getCategoryIcon = (cat: HealthNoteCategory) => {
    switch (cat) {
      case 'medication':
        return <Pill className="w-3.5 h-3.5 text-blue-500" />;
      case 'vaccine':
        return <Syringe className="w-3.5 h-3.5 text-emerald-500" />;
      case 'symptom':
        return <Activity className="w-3.5 h-3.5 text-amber-500" />;
      case 'advice':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Sub-Tab Navigation Header */}
      <div className="p-1 bg-white dark:bg-charcoal-800 rounded-2xl border border-warmgray-200 dark:border-charcoal-700 grid grid-cols-3 gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('appointments')}
          className={`py-2 px-2.5 rounded-xl font-medium text-xs flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
            subTab === 'appointments'
              ? 'bg-sage-50 dark:bg-charcoal-700 text-sage-800 dark:text-sage-200 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
          <span className="truncate">Visits</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('growth')}
          className={`py-2 px-2.5 rounded-xl font-medium text-xs flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
            subTab === 'growth'
              ? 'bg-sage-50 dark:bg-charcoal-700 text-sage-800 dark:text-sage-200 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
          <span className="truncate">Growth</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('notes')}
          className={`py-2 px-2.5 rounded-xl font-medium text-xs flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
            subTab === 'notes'
              ? 'bg-sage-50 dark:bg-charcoal-700 text-sage-800 dark:text-sage-200 font-semibold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
          <span className="truncate">Notes</span>
        </button>
      </div>

      {/* ================= 1. APPOINTMENTS SUB-TAB ================= */}
      {subTab === 'appointments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pediatrician Appointments
            </h2>
            <button
              type="button"
              onClick={() => openModal('appointment')}
              className="px-3 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium flex items-center space-x-1 transition-colors min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Visit</span>
            </button>
          </div>

          {sortedAppointments.length > 0 ? (
            <div className="space-y-3">
              {sortedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`p-4 rounded-3xl bg-white dark:bg-charcoal-800 border transition-all ${
                    apt.isCompleted
                      ? 'border-warmgray-200 dark:border-charcoal-700 opacity-75'
                      : 'border-warmgray-200 dark:border-charcoal-700 shadow-2xs hover:border-warmgray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleAppointmentComplete(apt.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-sage-600 dark:hover:text-sage-400 transition-colors mt-0.5"
                        aria-label={apt.isCompleted ? 'Mark uncompleted' : 'Mark completed'}
                      >
                        {apt.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-sage-600 dark:text-sage-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold text-sm text-slate-900 dark:text-slate-100 truncate ${apt.isCompleted ? 'line-through text-slate-400' : ''}`}>
                            {apt.title}
                          </h3>
                        </div>
                        <p className="text-xs text-sage-700 dark:text-sage-400 font-medium mt-0.5">
                          {formatDateTime(apt.dateTime)}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center space-x-1 truncate">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span>{apt.providerName}</span>
                          </span>
                          {apt.location && (
                            <span className="flex items-center space-x-1 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span>{apt.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Questions list */}
                        {apt.questions && apt.questions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-warmgray-100 dark:border-charcoal-700">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center space-x-1 mb-1">
                              <HelpCircle className="w-3 h-3 text-sage-600" />
                              <span>Questions to Ask:</span>
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600 dark:text-slate-400 pl-1">
                              {apt.questions.map((q, idx) => (
                                <li key={idx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Provider Instructions */}
                        {apt.providerInstructions && (
                          <div className="mt-2 text-xs bg-warmgray-50 dark:bg-charcoal-700/50 p-2.5 rounded-xl text-slate-600 dark:text-slate-300">
                            <span className="font-semibold block mb-0.5 text-[11px] text-slate-500">
                              Doctor Instructions:
                            </span>
                            {apt.providerInstructions}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAppointment(apt);
                          openModal('appointment');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-warmgray-100 dark:hover:bg-charcoal-700 transition-colors"
                        aria-label="Edit appointment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAppointment(apt.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        aria-label="Delete appointment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-white dark:bg-charcoal-800 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No doctor visits scheduled.
              </p>
              <button
                type="button"
                onClick={() => openModal('appointment')}
                className="px-3.5 py-2 rounded-xl bg-sage-600 text-white text-xs font-medium"
              >
                Schedule Checkup
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 2. GROWTH TRACKER SUB-TAB ================= */}
      {subTab === 'growth' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Growth Measurements
            </h2>
            <button
              type="button"
              onClick={() => openModal('growth')}
              className="px-3 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium flex items-center space-x-1 transition-colors min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Growth</span>
            </button>
          </div>

          {growthWithDeltas.length > 0 ? (
            <div className="space-y-3">
              {growthWithDeltas.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-3xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatDate(rec.timestamp)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGrowthRecord(rec);
                          openModal('growth');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-warmgray-100 dark:hover:bg-charcoal-700 transition-colors"
                        aria-label="Edit measurement"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGrowthRecord(rec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        aria-label="Delete measurement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-2xl bg-warmgray-50 dark:bg-charcoal-750 border border-warmgray-100 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block font-medium">Weight</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {rec.weightGrams ? formatWeight(rec.weightGrams, state.settings.weightUnit) : 'N/A'}
                      </span>
                      {rec.weightDeltaGrams !== null && (
                        <span className={`text-[10px] block font-mono font-medium ${rec.weightDeltaGrams >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                          {rec.weightDeltaGrams >= 0 ? `+${rec.weightDeltaGrams}g` : `${rec.weightDeltaGrams}g`}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-2xl bg-warmgray-50 dark:bg-charcoal-750 border border-warmgray-100 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block font-medium">Length</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {rec.lengthCm ? formatLength(rec.lengthCm, state.settings.lengthUnit) : 'N/A'}
                      </span>
                      {rec.lengthDeltaCm !== null && (
                        <span className="text-[10px] block font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                          {rec.lengthDeltaCm >= 0 ? `+${rec.lengthDeltaCm}cm` : `${rec.lengthDeltaCm}cm`}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-2xl bg-warmgray-50 dark:bg-charcoal-750 border border-warmgray-100 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block font-medium">Head Circ</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {rec.headCircumferenceCm ? formatLength(rec.headCircumferenceCm, state.settings.headUnit) : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Infant</span>
                    </div>
                  </div>

                  {rec.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-warmgray-50 dark:bg-charcoal-700/50 p-2 rounded-xl">
                      "{rec.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-white dark:bg-charcoal-800 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 space-y-2">
              <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No growth measurements recorded yet.
              </p>
              <button
                type="button"
                onClick={() => openModal('growth')}
                className="px-3.5 py-2 rounded-xl bg-sage-600 text-white text-xs font-medium"
              >
                Log First Measurement
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= 3. HEALTH NOTES SUB-TAB ================= */}
      {subTab === 'notes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Care & Health Notes
            </h2>
            <button
              type="button"
              onClick={() => openModal('healthNote')}
              className="px-3 py-1.5 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium flex items-center space-x-1 transition-colors min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            {['all', 'medication', 'vaccine', 'symptom', 'advice', 'general'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNoteCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-xl border whitespace-nowrap transition-colors min-h-[34px] capitalize ${
                  noteCategoryFilter === cat
                    ? 'border-sage-500 bg-sage-50 dark:bg-sage-950/50 text-sage-800 dark:text-sage-200 font-semibold'
                    : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-500 hover:border-warmgray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredNotes.length > 0 ? (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-3xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 rounded-lg bg-warmgray-100 dark:bg-charcoal-700 flex items-center justify-center">
                        {getCategoryIcon(note.category)}
                      </span>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {note.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {note.category} • {formatDateTime(note.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHealthNote(note);
                          openModal('healthNote');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-warmgray-100 dark:hover:bg-charcoal-700 transition-colors"
                        aria-label="Edit note"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteHealthNote(note.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        aria-label="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-warmgray-50/70 dark:bg-charcoal-750 p-3 rounded-2xl">
                    {note.details}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-white dark:bg-charcoal-800 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No health notes found for this category.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
