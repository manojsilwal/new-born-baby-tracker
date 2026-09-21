// src/components/history/HistoryView.tsx
import React, { useState, useMemo } from 'react';
import { useTracker } from '../../context/TrackerContext';
import {
  FeedingEvent,
  DiaperEvent,
  SleepEvent,
  TemperatureEvent,
} from '../../types/tracker';
import {
  formatShortDate,
  formatWeekdayDate,
  formatTime,
  formatDuration,
  formatVolume,
  formatTemperature,
} from '../../utils/units';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Edit2,
  Trash2,
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { state, openModal, setEditingEvent, deleteEvent } = useTracker();

  // Page offset in weeks: 0 = current 7 days, 1 = previous 7 days, etc.
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Generate the array of 7 dates for the current week window
  const days = useMemo(() => {
    const list: { dateStr: string; dateObj: Date; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (weekOffset * 7 + i));
      const dateStr = d.toISOString().split('T')[0];
      list.push({
        dateStr,
        dateObj: d,
        isToday: weekOffset === 0 && i === 0,
      });
    }
    return list;
  }, [weekOffset]);

  // Aggregate event data per day derived dynamically from stored events
  const dailySummaries = useMemo(() => {
    return days.map(({ dateStr, dateObj, isToday }) => {
      // Find all events belonging to this calendar date
      const dayEvents = state.events
        .filter((e) => {
          const eDate = ('timestamp' in e ? e.timestamp : e.startTime).split('T')[0];
          return eDate === dateStr;
        })
        .sort((a, b) => {
          const tA = new Date('timestamp' in a ? a.timestamp : a.startTime).getTime();
          const tB = new Date('timestamp' in b ? b.timestamp : b.startTime).getTime();
          return tB - tA;
        });

      let wetCount = 0;
      let dirtyCount = 0;
      let bottleMl = 0;
      let nursingSeconds = 0;
      let sleepSeconds = 0;
      let tempCount = 0;

      dayEvents.forEach((e) => {
        if (e.type === 'diaper') {
          const d = e as DiaperEvent;
          if (d.hasPee) wetCount++;
          if (d.hasPoop) dirtyCount++;
        } else if (e.type === 'feeding') {
          const f = e as FeedingEvent;
          if (f.feedType === 'bottle') bottleMl += f.volumeMl || 0;
          else if (f.feedType === 'nursing') nursingSeconds += f.totalDurationSeconds || 0;
        } else if (e.type === 'sleep') {
          const s = e as SleepEvent;
          sleepSeconds += s.durationSeconds || 0;
        } else if (e.type === 'temperature') {
          tempCount++;
        }
      });

      // Check if any appointment occurred or is scheduled on this date
      const hasAppointment = state.appointments.some(
        (a) => a.dateTime.split('T')[0] === dateStr
      );

      return {
        dateStr,
        dateObj,
        isToday,
        dayEvents,
        wetCount,
        dirtyCount,
        bottleMl,
        nursingSeconds,
        sleepSeconds,
        tempCount,
        hasAppointment,
        hasRecords: dayEvents.length > 0 || hasAppointment,
      };
    });
  }, [days, state.events, state.appointments]);

  const toggleExpand = (dateStr: string) => {
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  return (
    <div className="space-y-4 pb-24">
      {/* ================= DOCTOR SUMMARY CARD ================= */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-sage-50 to-warmgray-50 dark:from-charcoal-800 dark:to-charcoal-850 border border-sage-200 dark:border-charcoal-700 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-sage-500 text-white flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              48-Hour Doctor Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formatted clinical breakdown for pediatric visits
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openModal('doctorSummary')}
          className="px-3.5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold shadow-2xs transition-colors min-h-[40px] flex-shrink-0"
        >
          View Summary
        </button>
      </div>

      {/* ================= 7-DAY NAVIGATION HEADER ================= */}
      <div className="flex items-center justify-between bg-white dark:bg-charcoal-800 p-3 rounded-2xl border border-warmgray-200 dark:border-charcoal-700">
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="p-2 rounded-xl hover:bg-warmgray-100 dark:hover:bg-charcoal-700 text-slate-600 dark:text-slate-300 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Previous 7 days"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            {formatShortDate(days[days.length - 1].dateObj.toISOString())} –{' '}
            {formatShortDate(days[0].dateObj.toISOString())}
          </span>
          <span className="text-[10px] text-slate-400">
            {weekOffset === 0 ? 'Current 7 Days' : `${weekOffset} ${weekOffset === 1 ? 'week' : 'weeks'} ago`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
          disabled={weekOffset === 0}
          className="p-2 rounded-xl hover:bg-warmgray-100 dark:hover:bg-charcoal-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Next 7 days"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ================= 7 DAILY CARDS ================= */}
      <div className="space-y-2.5">
        {dailySummaries.map((day) => {
          const isExpanded = expandedDate === day.dateStr;

          return (
            <div
              key={day.dateStr}
              className="bg-white dark:bg-charcoal-800 rounded-2xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden shadow-2xs transition-colors"
            >
              {/* Daily Header Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleExpand(day.dateStr)}
                className="w-full p-3.5 text-left flex items-center justify-between hover:bg-warmgray-50 dark:hover:bg-charcoal-750 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center space-x-2.5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {formatWeekdayDate(day.dateObj.toISOString())}
                      </span>
                      {day.isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-sage-100 dark:bg-sage-950 text-sage-800 dark:text-sage-300 text-[10px] font-semibold">
                          Today
                        </span>
                      )}
                      {day.hasAppointment && (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-medium flex items-center space-x-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>Visit</span>
                        </span>
                      )}
                    </div>
                    {/* Quick inline metric labels */}
                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>{day.wetCount} wet</span>
                      <span>•</span>
                      <span>{day.dirtyCount} dirty</span>
                      <span>•</span>
                      <span>
                        {day.nursingSeconds > 0
                          ? `${formatDuration(day.nursingSeconds)} nurse`
                          : formatVolume(day.bottleMl, state.settings.bottleUnit)}
                      </span>
                      <span>•</span>
                      <span>{formatDuration(day.sleepSeconds)} sleep</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {day.dayEvents.length} {day.dayEvents.length === 1 ? 'event' : 'events'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded Day Details */}
              {isExpanded && (
                <div className="border-t border-warmgray-100 dark:border-charcoal-700 bg-warmgray-50/70 dark:bg-charcoal-850 p-4 space-y-3">
                  {/* Daily Metric Badges */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block">Wet Diapers</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{day.wetCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block">Dirty Diapers</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{day.dirtyCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block">Bottle Vol</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatVolume(day.bottleMl, state.settings.bottleUnit)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block">Nursing Time</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatDuration(day.nursingSeconds)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block">Total Sleep</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatDuration(day.sleepSeconds)}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700">
                      <span className="text-[10px] text-slate-400 block">Temp Checks</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{day.tempCount}</span>
                    </div>
                  </div>

                  {/* Day's Event Timeline */}
                  {day.dayEvents.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Detailed Day Timeline
                      </span>
                      <div className="space-y-2">
                        {day.dayEvents.map((e) => {
                          const eTime = 'timestamp' in e ? e.timestamp : e.startTime;
                          return (
                            <div
                              key={e.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <span className="font-mono text-slate-400 flex-shrink-0 text-[11px]">
                                  {formatTime(eTime)}
                                </span>
                                <div className="truncate min-w-0 flex-1">
                                  {e.type === 'feeding' && (
                                    <span>
                                      Feed: {(e as FeedingEvent).feedType === 'nursing'
                                        ? `Nursed (${Math.round(((e as FeedingEvent).totalDurationSeconds || 0) / 60)}m)`
                                        : `Bottle (${formatVolume((e as FeedingEvent).volumeMl || 0, state.settings.bottleUnit)})`}
                                    </span>
                                  )}
                                  {e.type === 'diaper' && (
                                    <span>
                                      Diaper: {(e as DiaperEvent).hasPee && (e as DiaperEvent).hasPoop
                                        ? 'Pee + Poop'
                                        : (e as DiaperEvent).hasPoop
                                        ? 'Poop'
                                        : 'Wet'}
                                    </span>
                                  )}
                                  {e.type === 'sleep' && (
                                    <span>
                                      Sleep: {formatDuration((e as SleepEvent).durationSeconds)}
                                    </span>
                                  )}
                                  {e.type === 'temperature' && (
                                    <span>
                                      Temp: {formatTemperature((e as TemperatureEvent).temperatureCelsius, state.settings.temperatureUnit)}
                                    </span>
                                  )}
                                  {e.recordedBy && (
                                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                      by {e.recordedBy.displayName}
                                      {e.recordedBy.role === 'admin' ? ' (Admin)' : ''}
                                    </span>
                                  )}
                                  {e.note && (
                                    <span className="text-[11px] text-slate-400 italic ml-1.5">
                                      - {e.note}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEvent(e);
                                    if (e.type === 'feeding') openModal('feed');
                                    else if (e.type === 'diaper') openModal('diaper');
                                    else if (e.type === 'sleep') openModal('sleep');
                                    else if (e.type === 'temperature') openModal('temperature');
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  aria-label="Edit record"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteEvent(e.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  aria-label="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2 italic">
                      No events logged for this date.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
