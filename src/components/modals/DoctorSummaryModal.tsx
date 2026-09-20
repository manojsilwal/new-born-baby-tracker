// src/components/modals/DoctorSummaryModal.tsx
import React, { useMemo } from 'react';
import { useTracker } from '../../context/TrackerContext';
import {
  FeedingEvent,
  DiaperEvent,
  SleepEvent,
  TemperatureEvent,
} from '../../types/tracker';
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatVolume,
  formatTemperature,
  formatWeight,
  formatLength,
  calculateBabyAge,
} from '../../utils/units';
import {
  X,
  Printer,
  Copy,
  Download,
  FileText,
  Droplets,
  Milk,
  Moon,
} from 'lucide-react';

export const DoctorSummaryModal: React.FC = () => {
  const { state, closeModal, showToast } = useTracker();
  const { profile, settings, events, growthRecords, healthNotes, appointments } = state;

  const now = Date.now();
  const rolling48HoursAgo = now - 48 * 3600 * 1000;

  // Filter records within the rolling 48-hour window
  const summaryData = useMemo(() => {
    const recentEvents = events.filter((e) => {
      const t = 'timestamp' in e ? new Date(e.timestamp).getTime() : new Date(e.startTime).getTime();
      return t >= rolling48HoursAgo;
    });

    // Feeding stats
    const feedEvents = recentEvents.filter((e): e is FeedingEvent => e.type === 'feeding');
    let totalFeeds = feedEvents.length;
    let nursingFeedsCount = 0;
    let totalLeftSec = 0;
    let totalRightSec = 0;
    let bottleFeedsCount = 0;
    let expressedMl = 0;
    let formulaMl = 0;

    feedEvents.forEach((f) => {
      if (f.feedType === 'nursing') {
        nursingFeedsCount++;
        totalLeftSec += f.leftDurationSeconds || 0;
        totalRightSec += f.rightDurationSeconds || 0;
      } else if (f.feedType === 'bottle') {
        bottleFeedsCount++;
        if (f.bottleType === 'formula') {
          formulaMl += f.volumeMl || 0;
        } else {
          expressedMl += f.volumeMl || 0;
        }
      }
    });

    // Diaper stats
    const diaperEvents = recentEvents.filter((e): e is DiaperEvent => e.type === 'diaper');
    let wetCount = 0;
    let dirtyCount = 0;
    const stoolColors = new Set<string>();
    const stoolConsistencies = new Set<string>();

    diaperEvents.forEach((d) => {
      if (d.hasPee) wetCount++;
      if (d.hasPoop) {
        dirtyCount++;
        if (d.poopColor) stoolColors.add(d.poopColor);
        if (d.poopConsistency) stoolConsistencies.add(d.poopConsistency);
      }
    });

    // Sleep stats
    const sleepEvents = recentEvents.filter((e): e is SleepEvent => e.type === 'sleep');
    let totalSleepSec = 0;
    sleepEvents.forEach((s) => {
      totalSleepSec += s.durationSeconds || 0;
    });

    // Temperature stats
    const tempEvents = recentEvents
      .filter((e): e is TemperatureEvent => e.type === 'temperature')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let highestTempC: number | null = null;
    tempEvents.forEach((t) => {
      if (highestTempC === null || t.temperatureCelsius > highestTempC) {
        highestTempC = t.temperatureCelsius;
      }
    });

    // Latest Growth
    const latestGrowth = growthRecords.length > 0 ? growthRecords[0] : null;

    // Upcoming Appointment
    const upcomingApt = appointments
      .filter((a) => !a.isCompleted && new Date(a.dateTime).getTime() >= now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0] || null;

    // Recent Health Notes (within last 7 days)
    const recentNotes = healthNotes.slice(0, 3);

    return {
      totalFeeds,
      nursingFeedsCount,
      totalLeftSec,
      totalRightSec,
      totalNursingSec: totalLeftSec + totalRightSec,
      bottleFeedsCount,
      expressedMl,
      formulaMl,
      totalBottleMl: expressedMl + formulaMl,
      wetCount,
      dirtyCount,
      stoolColors: Array.from(stoolColors),
      stoolConsistencies: Array.from(stoolConsistencies),
      totalSleepSec,
      sleepSessionCount: sleepEvents.length,
      tempEvents,
      highestTempC,
      latestGrowth,
      upcomingApt,
      recentNotes,
      generatedAt: new Date().toISOString(),
    };
  }, [events, growthRecords, healthNotes, appointments, rolling48HoursAgo, now]);

  // Copy plain text summary to clipboard
  const handleCopy = () => {
    const text = `
48-HOUR PEDIATRIC VISIT SUMMARY
=========================================
Baby: ${profile.name || 'Baby'}
${profile.birthDate ? `Birth Date: ${profile.birthDate} (${calculateBabyAge(profile.birthDate)})` : ''}
Summary Period: Previous 48 Rolling Hours
Generated: ${formatDateTime(summaryData.generatedAt)}

DIAPERS
- Wet Diapers: ${summaryData.wetCount}
- Dirty (Stool) Diapers: ${summaryData.dirtyCount}
- Stool Colors Observed: ${summaryData.stoolColors.length ? summaryData.stoolColors.join(', ') : 'None'}
- Stool Consistencies: ${summaryData.stoolConsistencies.length ? summaryData.stoolConsistencies.join(', ') : 'None'}

FEEDINGS (${summaryData.totalFeeds} Total Feeds)
- Nursing Sessions: ${summaryData.nursingFeedsCount}
  • Total Time: ${formatDuration(summaryData.totalNursingSec)} (Left: ${formatDuration(summaryData.totalLeftSec)}, Right: ${formatDuration(summaryData.totalRightSec)})
- Bottle Feeds: ${summaryData.bottleFeedsCount}
  • Expressed Milk: ${formatVolume(summaryData.expressedMl, settings.bottleUnit)}
  • Formula: ${formatVolume(summaryData.formulaMl, settings.bottleUnit)}
  • Total Volume: ${formatVolume(summaryData.totalBottleMl, settings.bottleUnit)}

SLEEP
- Total Sleep Time: ${formatDuration(summaryData.totalSleepSec)} across ${summaryData.sleepSessionCount} sleep sessions

TEMPERATURES
${
  summaryData.tempEvents.length > 0
    ? summaryData.tempEvents
        .map(
          (t) =>
            `- ${formatDateTime(t.timestamp)}: ${formatTemperature(t.temperatureCelsius, settings.temperatureUnit)}${
              t.temperatureCelsius >= 38.0 ? ' [FEVER NOTED]' : ''
            }${t.note ? ` (${t.note})` : ''}`
        )
        .join('\n')
    : '- No temperature checks logged in last 48 hours'
}
${
  summaryData.highestTempC !== null
    ? `Highest Recorded: ${formatTemperature(summaryData.highestTempC, settings.temperatureUnit)}`
    : ''
}

LATEST GROWTH STATS
${
  summaryData.latestGrowth
    ? `- Measured: ${formatDate(summaryData.latestGrowth.timestamp)}
  • Weight: ${summaryData.latestGrowth.weightGrams ? formatWeight(summaryData.latestGrowth.weightGrams, settings.weightUnit) : 'N/A'}
  • Length: ${summaryData.latestGrowth.lengthCm ? formatLength(summaryData.latestGrowth.lengthCm, settings.lengthUnit) : 'N/A'}
  • Head Circ: ${summaryData.latestGrowth.headCircumferenceCm ? formatLength(summaryData.latestGrowth.headCircumferenceCm, settings.headUnit) : 'N/A'}`
    : '- No growth measurements recorded'
}

${
  summaryData.upcomingApt
    ? `UPCOMING APPOINTMENT
- ${summaryData.upcomingApt.title} on ${formatDateTime(summaryData.upcomingApt.dateTime)}
  Provider: ${summaryData.upcomingApt.providerName}
  Questions Prepared: ${summaryData.upcomingApt.questions.join('; ')}`
    : ''
}
=========================================
Generated with Newborn Tracker (Local-First Care Companion)
    `.trim();

    navigator.clipboard.writeText(text);
    showToast('Doctor summary copied to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-summary-48h-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Doctor summary JSON downloaded');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-summary-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-charcoal-850 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/60 dark:bg-charcoal-800/60 print:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-600 dark:text-sage-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 id="doctor-summary-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                48-Hour Doctor Summary
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rolling 48h overview for pediatric visits
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-warmgray-200 dark:hover:bg-charcoal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-5 py-3 border-b border-warmgray-200 dark:border-charcoal-700 flex items-center justify-between bg-warmgray-50 dark:bg-charcoal-800 print:hidden">
          <span className="text-xs text-slate-500 dark:text-slate-400">Ready for clinic visit</span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 hover:bg-warmgray-300 dark:hover:bg-charcoal-600 flex items-center space-x-1.5 transition-colors min-h-[36px]"
              aria-label="Copy summary to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sage-600 hover:bg-sage-700 text-white flex items-center space-x-1.5 transition-colors min-h-[36px]"
              aria-label="Print summary"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="p-2 rounded-lg bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 hover:bg-warmgray-300 dark:hover:bg-charcoal-600 flex items-center justify-center transition-colors min-h-[36px] min-w-[36px]"
              title="Export as JSON"
              aria-label="Export as JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div id="printable-doctor-summary" className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 print:p-0 print:text-black">
          {/* Patient / Baby Identification Banner */}
          <div className="flex items-start justify-between border-b border-warmgray-200 dark:border-charcoal-700 pb-4 print:border-black/20">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 print:text-black">
                {profile.name || 'Baby'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600 mt-0.5">
                {profile.birthDate && (
                  <span>
                    Birth Date: {formatDate(profile.birthDate)} ({calculateBabyAge(profile.birthDate)})
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-sage-100 dark:bg-sage-950 text-sage-800 dark:text-sage-300 text-[11px] font-semibold print:border print:border-gray-400">
                48-Hour Clinical Log
              </span>
              <p className="text-[10px] text-slate-400 print:text-gray-500 mt-1">
                Generated: {formatDateTime(summaryData.generatedAt)}
              </p>
            </div>
          </div>

          {/* Key Vitals & Counts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-center print:border-gray-300">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1 mb-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>Wet Diapers</span>
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
                {summaryData.wetCount}
              </div>
              <span className="text-[10px] text-slate-400">in 48h</span>
            </div>

            <div className="p-3.5 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-center print:border-gray-300">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1 mb-1">
                <Droplets className="w-3.5 h-3.5 text-amber-600" />
                <span>Dirty Diapers</span>
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
                {summaryData.dirtyCount}
              </div>
              <span className="text-[10px] text-slate-400">in 48h</span>
            </div>

            <div className="p-3.5 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-center print:border-gray-300">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1 mb-1">
                <Milk className="w-3.5 h-3.5 text-sage-600" />
                <span>Total Feeds</span>
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-100">
                {summaryData.totalFeeds}
              </div>
              <span className="text-[10px] text-slate-400">sessions</span>
            </div>

            <div className="p-3.5 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-center print:border-gray-300">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1 mb-1">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Total Sleep</span>
              </div>
              <div className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatDuration(summaryData.totalSleepSec)}
              </div>
              <span className="text-[10px] text-slate-400">in 48h</span>
            </div>
          </div>

          {/* Section 1: Detailed Feedings */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-warmgray-200 dark:border-charcoal-700 pb-1">
              Feeding Breakdown
            </h3>
            <div className="bg-warmgray-50 dark:bg-charcoal-800/80 rounded-xl p-3.5 border border-warmgray-200 dark:border-charcoal-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Nursing Sessions:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {summaryData.nursingFeedsCount} feeds ({formatDuration(summaryData.totalNursingSec)} total)
                </span>
              </div>
              {summaryData.nursingFeedsCount > 0 && (
                <div className="pl-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <div>Left Breast: {formatDuration(summaryData.totalLeftSec)}</div>
                  <div>Right Breast: {formatDuration(summaryData.totalRightSec)}</div>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-warmgray-200 dark:border-charcoal-700">
                <span className="text-slate-600 dark:text-slate-400">Bottle Feeds:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {summaryData.bottleFeedsCount} feeds ({formatVolume(summaryData.totalBottleMl, settings.bottleUnit)})
                </span>
              </div>
              {summaryData.bottleFeedsCount > 0 && (
                <div className="pl-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <div>Expressed Milk: {formatVolume(summaryData.expressedMl, settings.bottleUnit)}</div>
                  <div>Formula: {formatVolume(summaryData.formulaMl, settings.bottleUnit)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Stool & Diaper Observations */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-warmgray-200 dark:border-charcoal-700 pb-1">
              Diaper & Stool Observations
            </h3>
            <div className="bg-warmgray-50 dark:bg-charcoal-800/80 rounded-xl p-3.5 border border-warmgray-200 dark:border-charcoal-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Stool Colors Observed:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {summaryData.stoolColors.length ? summaryData.stoolColors.join(', ') : 'None logged'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Stool Consistencies Observed:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {summaryData.stoolConsistencies.length ? summaryData.stoolConsistencies.join(', ') : 'None logged'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Temperature Readings */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-warmgray-200 dark:border-charcoal-700 pb-1 flex items-center justify-between">
              <span>Temperature Measurements</span>
              {summaryData.highestTempC !== null && (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Peak: {formatTemperature(summaryData.highestTempC, settings.temperatureUnit)}
                </span>
              )}
            </h3>
            {summaryData.tempEvents.length > 0 ? (
              <div className="divide-y divide-warmgray-200 dark:divide-charcoal-700 border border-warmgray-200 dark:border-charcoal-700 rounded-xl overflow-hidden bg-warmgray-50 dark:bg-charcoal-800/80">
                {summaryData.tempEvents.map((t) => (
                  <div key={t.id} className="p-2.5 px-3.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{formatDateTime(t.timestamp)}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono font-semibold ${t.temperatureCelsius >= 38.0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                        {formatTemperature(t.temperatureCelsius, settings.temperatureUnit)}
                      </span>
                      {t.temperatureCelsius >= 38.0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                          FEVER
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No temperature checks logged in previous 48 hours.</p>
            )}
          </div>

          {/* Section 4: Latest Growth Measurements */}
          {summaryData.latestGrowth && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-warmgray-200 dark:border-charcoal-700 pb-1">
                Latest Growth Record
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                  <span className="text-[10px] text-slate-400 block">Weight</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {summaryData.latestGrowth.weightGrams ? formatWeight(summaryData.latestGrowth.weightGrams, settings.weightUnit) : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                  <span className="text-[10px] text-slate-400 block">Length</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {summaryData.latestGrowth.lengthCm ? formatLength(summaryData.latestGrowth.lengthCm, settings.lengthUnit) : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                  <span className="text-[10px] text-slate-400 block">Head Circ</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {summaryData.latestGrowth.headCircumferenceCm ? formatLength(summaryData.latestGrowth.headCircumferenceCm, settings.headUnit) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Upcoming Appointment & Prepared Questions */}
          {summaryData.upcomingApt && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-warmgray-200 dark:border-charcoal-700 pb-1">
                Upcoming Appointment & Questions
              </h3>
              <div className="p-3.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-xs space-y-2">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {summaryData.upcomingApt.title} ({formatDateTime(summaryData.upcomingApt.dateTime)})
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {summaryData.upcomingApt.providerName} • {summaryData.upcomingApt.location || 'Clinic'}
                </div>
                {summaryData.upcomingApt.questions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-warmgray-200 dark:border-charcoal-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Parent Questions to Ask:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400 pl-1">
                      {summaryData.upcomingApt.questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medical Disclaimer */}
          <div className="pt-4 border-t border-warmgray-200 dark:border-charcoal-700 text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
            <p>
              Note: This report compiles observational logs entered by caregivers and is provided solely for
              discussion during pediatric consultations. It does not constitute medical diagnosis, clinical triage,
              or health recommendations. In an emergency, contact 911 or your local emergency department immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
