// src/components/modals/TemperatureModal.tsx
import React, { useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { TemperatureEvent } from '../../types/tracker';
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  isFever,
} from '../../utils/units';
import {
  X,
  Check,
  Clock,
  Trash2,
  AlertTriangle,
  Thermometer,
  Info,
} from 'lucide-react';

export const TemperatureModal: React.FC = () => {
  const {
    state,
    closeModal,
    addEvent,
    updateEvent,
    deleteEvent,
    editingEvent,
  } = useTracker();

  const isEditing = editingEvent && editingEvent.type === 'temperature';
  const existingTemp = isEditing ? (editingEvent as TemperatureEvent) : null;

  const [unit, setUnit] = useState<'F' | 'C'>(state.settings.temperatureUnit);

  const [tempInput, setTempInput] = useState<string>(() => {
    if (existingTemp) {
      if (state.settings.temperatureUnit === 'F') {
        return celsiusToFahrenheit(existingTemp.temperatureCelsius).toFixed(1);
      }
      return existingTemp.temperatureCelsius.toFixed(1);
    }
    return state.settings.temperatureUnit === 'F' ? '98.4' : '36.9';
  });

  const [timestamp, setTimestamp] = useState<string>(() => {
    if (existingTemp?.timestamp) return existingTemp.timestamp.slice(0, 16);
    return new Date().toISOString().slice(0, 16);
  });

  const [note, setNote] = useState<string>(existingTemp?.note || '');
  const [alertAcknowledged, setAlertAcknowledged] = useState<boolean>(
    existingTemp?.alertAcknowledged || false
  );
  const [unusualWarningAck, setUnusualWarningAck] = useState<boolean>(false);

  // Canonical Celsius calculation
  const numericVal = parseFloat(tempInput) || 0;
  const canonicalCelsius = unit === 'F' ? fahrenheitToCelsius(numericVal) : numericVal;
  const feverDetected = isFever(canonicalCelsius);

  // Plausibility check: typically 93°F - 106°F (34°C - 41°C)
  const isUnusual =
    unit === 'F'
      ? numericVal < 95.0 || numericVal > 105.0
      : canonicalCelsius < 35.0 || canonicalCelsius > 40.5;

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  const handleUnitToggle = (newUnit: 'F' | 'C') => {
    if (newUnit === unit) return;
    const currentNum = parseFloat(tempInput);
    if (!isNaN(currentNum)) {
      if (newUnit === 'F') {
        setTempInput(celsiusToFahrenheit(currentNum).toFixed(1));
      } else {
        setTempInput(fahrenheitToCelsius(currentNum).toFixed(1));
      }
    }
    setUnit(newUnit);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numericVal) || numericVal <= 0) return;

    if (feverDetected && !alertAcknowledged) {
      return;
    }

    if (isUnusual && !unusualWarningAck) {
      return;
    }

    const iso = new Date(timestamp).toISOString();

    if (existingTemp) {
      updateEvent({
        ...existingTemp,
        timestamp: iso,
        temperatureCelsius: canonicalCelsius,
        alertAcknowledged: feverDetected ? alertAcknowledged : false,
        note: note.trim() || undefined,
      });
    } else {
      addEvent({
        type: 'temperature',
        timestamp: iso,
        temperatureCelsius: canonicalCelsius,
        alertAcknowledged: feverDetected ? alertAcknowledged : false,
        note: note.trim() || undefined,
      });
    }
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="temperature-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
            <h2 id="temperature-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {existingTemp ? 'Edit Temperature' : 'Log Temperature'}
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5">
          {/* Temperature Numeric Input and Unit Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Temperature Reading
              </label>
              {/* Unit Toggle */}
              <div className="flex items-center bg-warmgray-200 dark:bg-charcoal-800 rounded-lg p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleUnitToggle('F')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    unit === 'F'
                      ? 'bg-white dark:bg-charcoal-700 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  °F
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitToggle('C')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    unit === 'C'
                      ? 'bg-white dark:bg-charcoal-700 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  °C
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const curr = parseFloat(tempInput) || 0;
                  setTempInput((Math.round((curr - 0.1) * 10) / 10).toFixed(1));
                }}
                className="w-12 h-12 rounded-xl bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 font-bold text-lg flex items-center justify-center hover:bg-warmgray-300 dark:hover:bg-charcoal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
                aria-label="Decrease by 0.1 degree"
              >
                -
              </button>
              <div
                className={`flex-1 text-center bg-white dark:bg-charcoal-800 border rounded-xl py-2 px-3 transition-colors ${
                  feverDetected
                    ? 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-200 dark:ring-rose-900/50'
                    : 'border-warmgray-200 dark:border-charcoal-700'
                }`}
              >
                <input
                  type="number"
                  step="0.1"
                  min={unit === 'F' ? '80' : '26'}
                  max={unit === 'F' ? '115' : '45'}
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  className={`w-full text-center font-mono font-bold text-3xl bg-transparent focus:outline-none ${
                    feverDetected ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                  }`}
                  required
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  °{unit} {unit === 'F' ? `(~${canonicalCelsius.toFixed(1)}°C)` : `(~${celsiusToFahrenheit(canonicalCelsius).toFixed(1)}°F)`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const curr = parseFloat(tempInput) || 0;
                  setTempInput((Math.round((curr + 0.1) * 10) / 10).toFixed(1));
                }}
                className="w-12 h-12 rounded-xl bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 font-bold text-lg flex items-center justify-center hover:bg-warmgray-300 dark:hover:bg-charcoal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
                aria-label="Increase by 0.1 degree"
              >
                +
              </button>
            </div>
          </div>

          {/* HIGH-PRIORITY FEVER WARNING IF >= 100.4°F / 38°C */}
          {feverDetected && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-3 shadow-xs"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold text-rose-900 dark:text-rose-100 text-sm mb-1">
                    Newborn Fever Guidance Notice
                  </p>
                  <p>
                    A temperature of 100.4°F (38°C) or higher in a newborn requires prompt guidance from a
                    qualified healthcare professional. Contact your pediatrician or appropriate urgent medical
                    service.
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-1.5">
                    This tracker is for personal logging only and does not diagnose conditions. If your infant is
                    unresponsive, breathing rapidly, refusing feeds, or you suspect an emergency, seek immediate
                    emergency medical attention.
                  </p>
                </div>
              </div>
              <label className="flex items-center space-x-2.5 pt-1 text-xs font-medium text-rose-900 dark:text-rose-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertAcknowledged}
                  onChange={(e) => setAlertAcknowledged(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-rose-400 cursor-pointer"
                  required
                />
                <span>I have read and acknowledged this medical guidance notice.</span>
              </label>
            </div>
          )}

          {/* Unusual Range Notice */}
          {isUnusual && !feverDetected && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-semibold">Verify measurement reading</span>
              </div>
              <p>
                {numericVal} °{unit} is outside the usual typical newborn temperature range. Please double check the
                thermometer reading before saving.
              </p>
              <label className="flex items-center space-x-2 pt-1 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={unusualWarningAck}
                  onChange={(e) => setUnusualWarningAck(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <span>I verified that this number is what my thermometer displays.</span>
              </label>
            </div>
          )}

          {/* Timestamp */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Time of Measurement
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

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rectal check, calm baby, checked before bedtime"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500"
            />
          </div>

          {/* Save & Delete actions */}
          <div className="flex items-center space-x-2 pt-2">
            {existingTemp && (
              <button
                type="button"
                onClick={() => {
                  deleteEvent(existingTemp.id);
                  closeModal();
                }}
                className="p-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Delete temperature record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={(feverDetected && !alertAcknowledged) || (isUnusual && !unusualWarningAck)}
              className="flex-1 py-3 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>{existingTemp ? 'Update Temperature' : 'Save Temperature'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
