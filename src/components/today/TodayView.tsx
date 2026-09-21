// src/components/today/TodayView.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useTracker } from '../../context/TrackerContext';
import {
  FeedingEvent,
  DiaperEvent,
  SleepEvent,
  TemperatureEvent,
} from '../../types/tracker';
import {
  formatTime,
  formatRelativeTime,
  formatDuration,
  formatVolume,
  formatTemperature,
} from '../../utils/units';
import { ActiveTimerBanner } from '../ActiveTimerBanner';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import {
  Baby,
  Milk,
  Droplets,
  Moon,
  Thermometer,
  Edit2,
  Trash2,
  Sparkles,
  Zap,
} from 'lucide-react';

export const TodayView: React.FC = () => {
  const {
    state,
    openModal,
    setEditingEvent,
    deleteEvent,
    quickWetDiaper,
    quickBottleFeed,
  } = useTracker();

  // Deletion confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Time tick for "Time Since Last" updates (every 30s)
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const nowMs = currentTime.getTime();
  const rolling24HoursAgo = nowMs - 24 * 3600 * 1000;

  // 1. Time Since Last calculations
  const { lastFed, lastDiaper, lastSlept } = useMemo(() => {
    let fed: FeedingEvent | null = null;
    let diaper: DiaperEvent | null = null;
    let slept: SleepEvent | null = null;

    for (const e of state.events) {
      if (!fed && e.type === 'feeding') fed = e as FeedingEvent;
      if (!diaper && e.type === 'diaper') diaper = e as DiaperEvent;
      if (!slept && e.type === 'sleep') slept = e as SleepEvent;
      if (fed && diaper && slept) break;
    }

    return { lastFed: fed, lastDiaper: diaper, lastSlept: slept };
  }, [state.events]);

  // 2. Rolling 24-Hour Summary Calculation
  const summary24h = useMemo(() => {
    const eventsIn24h = state.events.filter((e) => {
      const timeMs = 'timestamp' in e ? new Date(e.timestamp).getTime() : new Date(e.startTime).getTime();
      return timeMs >= rolling24HoursAgo;
    });

    let wetCount = 0;
    let dirtyCount = 0;
    let bottleMl = 0;
    let nursingSeconds = 0;
    let sleepSeconds = 0;
    let latestTempC: number | null = null;

    eventsIn24h.forEach((e) => {
      if (e.type === 'diaper') {
        const d = e as DiaperEvent;
        if (d.hasPee) wetCount++;
        if (d.hasPoop) dirtyCount++;
      } else if (e.type === 'feeding') {
        const f = e as FeedingEvent;
        if (f.feedType === 'bottle') {
          bottleMl += f.volumeMl || 0;
        } else if (f.feedType === 'nursing') {
          nursingSeconds += f.totalDurationSeconds || 0;
        }
      } else if (e.type === 'sleep') {
        const s = e as SleepEvent;
        sleepSeconds += s.durationSeconds || 0;
      } else if (e.type === 'temperature') {
        const t = e as TemperatureEvent;
        if (latestTempC === null) {
          latestTempC = t.temperatureCelsius;
        }
      }
    });

    return {
      wetCount,
      dirtyCount,
      bottleMl,
      nursingSeconds,
      sleepSeconds,
      latestTempC,
    };
  }, [state.events, rolling24HoursAgo]);

  // 3. Today's Events Timeline (Events occurring in the calendar day of today or past 24h)
  const todayDateStr = currentTime.toISOString().split('T')[0];
  const todayEvents = useMemo(() => {
    return state.events
      .filter((e) => {
        const dateStr = ('timestamp' in e ? e.timestamp : e.startTime).split('T')[0];
        return dateStr === todayDateStr;
      })
      .sort((a, b) => {
        const timeA = new Date('timestamp' in a ? a.timestamp : a.startTime).getTime();
        const timeB = new Date('timestamp' in b ? b.timestamp : b.startTime).getTime();
        return timeB - timeA;
      });
  }, [state.events, todayDateStr]);

  // Scrolling to event when Time Since Last card is clicked
  const handleCardClick = (eventId?: string) => {
    if (!eventId) return;
    setHighlightedEventId(eventId);
    const el = document.getElementById(`event-${eventId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setHighlightedEventId(null), 2500);
  };

  const itemToDelete = state.events.find((e) => e.id === deletingId);

  return (
    <div className="space-y-5 pb-24">
      {/* ================= 1. TIME SINCE LAST CARDS ================= */}
      <section aria-labelledby="time-since-last-heading">
        <h2 id="time-since-last-heading" className="sr-only">
          Time Since Last Care Actions
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {/* Last Fed */}
          <button
            type="button"
            onClick={() => handleCardClick(lastFed?.id)}
            className="p-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-left transition-all hover:border-warmgray-300 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[82px] flex flex-col justify-between"
          >
            <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs">
              <Milk className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
              <span className="font-medium truncate">Last Fed</span>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {lastFed ? formatRelativeTime(lastFed.startTime, currentTime) : 'None logged'}
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {lastFed
                ? lastFed.feedType === 'nursing'
                  ? `Nursed (${lastFed.lastActiveSide || 'side'})`
                  : `Bottle (${formatVolume(lastFed.volumeMl || 0, state.settings.bottleUnit)})`
                : 'Tap to log'}
            </span>
          </button>

          {/* Last Diaper */}
          <button
            type="button"
            onClick={() => handleCardClick(lastDiaper?.id)}
            className="p-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-left transition-all hover:border-warmgray-300 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[82px] flex flex-col justify-between"
          >
            <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs">
              <Droplets className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium truncate">Last Diaper</span>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {lastDiaper ? formatRelativeTime(lastDiaper.timestamp, currentTime) : 'None logged'}
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {lastDiaper
                ? lastDiaper.hasPee && lastDiaper.hasPoop
                  ? 'Wet + Dirty'
                  : lastDiaper.hasPoop
                  ? 'Dirty'
                  : 'Wet'
                : 'Tap to log'}
            </span>
          </button>

          {/* Last Slept (start time of most recent sleep) */}
          <button
            type="button"
            onClick={() => handleCardClick(lastSlept?.id)}
            className="p-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-left transition-all hover:border-warmgray-300 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[82px] flex flex-col justify-between"
            title="Relative time calculated from start of last saved sleep session"
          >
            <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium truncate">Last Slept</span>
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {lastSlept ? formatRelativeTime(lastSlept.startTime, currentTime) : 'None logged'}
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {lastSlept ? `${formatDuration(lastSlept.durationSeconds)} nap` : 'Tap to log'}
            </span>
          </button>
        </div>
      </section>

      {/* ================= 2. ACTIVE TIMERS BANNER ================= */}
      <ActiveTimerBanner />

      {/* ================= 3. QUICK ACTION BAR ================= */}
      <section aria-labelledby="quick-actions-heading" className="space-y-2">
        <h2 id="quick-actions-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick Actions
        </h2>
        {/* Large Primary Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => openModal('feed')}
            className="py-3.5 px-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 hover:border-sage-400 dark:hover:border-sage-600 transition-all flex flex-col items-center justify-center space-y-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[72px]"
          >
            <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-950 text-sage-700 dark:text-sage-400 flex items-center justify-center">
              <Milk className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Feed</span>
          </button>

          <button
            type="button"
            onClick={() => openModal('diaper')}
            className="py-3.5 px-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col items-center justify-center space-y-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[72px]"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Diaper</span>
          </button>

          <button
            type="button"
            onClick={() => openModal('sleep')}
            className="py-3.5 px-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col items-center justify-center space-y-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[72px]"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Sleep</span>
          </button>
        </div>

        {/* Small One-Tap Shortcuts */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={quickWetDiaper}
            className="py-2.5 px-2 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-slate-700 dark:text-slate-300 hover:bg-warmgray-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors min-h-[44px]"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Wet</span>
          </button>

          <button
            type="button"
            onClick={() => quickBottleFeed(state.settings.bottleUnit === 'oz' ? 60 : 60)}
            className="py-2.5 px-2 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-slate-700 dark:text-slate-300 hover:bg-warmgray-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors min-h-[44px]"
          >
            <Zap className="w-3.5 h-3.5 text-sage-500" />
            <span>{state.settings.bottleUnit === 'oz' ? '+2 oz Bottle' : '+60 ml Bottle'}</span>
          </button>

          <button
            type="button"
            onClick={() => openModal('temperature')}
            className="py-2.5 px-2 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-slate-700 dark:text-slate-300 hover:bg-warmgray-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors min-h-[44px]"
          >
            <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            <span>Temp</span>
          </button>
        </div>
      </section>

      {/* ================= 4. ROLLING 24-HOUR SUMMARY ================= */}
      <section aria-labelledby="summary-heading">
        <div className="bg-white dark:bg-charcoal-800 rounded-3xl p-4 sm:p-5 border border-warmgray-200 dark:border-charcoal-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="summary-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Past 24 Hours Summary
            </h2>
            <span className="text-[11px] text-sage-600 dark:text-sage-400 font-medium">Rolling Window</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {/* Wet Diapers */}
            <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-700/50 border border-warmgray-100 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 font-medium block">Wet</span>
              <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                {summary24h.wetCount}
              </span>
            </div>

            {/* Dirty Diapers */}
            <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-700/50 border border-warmgray-100 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 font-medium block">Dirty</span>
              <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                {summary24h.dirtyCount}
              </span>
            </div>

            {/* Bottle Volume */}
            <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-700/50 border border-warmgray-100 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 font-medium block">Bottle</span>
              <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                {formatVolume(summary24h.bottleMl, state.settings.bottleUnit)}
              </span>
            </div>

            {/* Nursing Time */}
            <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-700/50 border border-warmgray-100 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 font-medium block">Nursing</span>
              <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                {formatDuration(summary24h.nursingSeconds)}
              </span>
            </div>

            {/* Total Sleep */}
            <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-700/50 border border-warmgray-100 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 font-medium block">Sleep</span>
              <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                {formatDuration(summary24h.sleepSeconds)}
              </span>
            </div>

            {/* Latest Temp */}
            <div className="p-2.5 rounded-xl bg-warmgray-50 dark:bg-charcoal-700/50 border border-warmgray-100 dark:border-charcoal-700">
              <span className="text-[10px] text-slate-400 font-medium block">Temp</span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                {summary24h.latestTempC !== null
                  ? formatTemperature(summary24h.latestTempC, state.settings.temperatureUnit)
                  : '--'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. TODAY'S ACTIVITY TIMELINE ================= */}
      <section aria-labelledby="timeline-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="timeline-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Activity
          </h2>
          <span className="text-xs text-slate-400">
            {todayEvents.length} {todayEvents.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {todayEvents.length > 0 ? (
          <div className="space-y-2.5">
            {todayEvents.map((event) => {
              const isHighlighted = highlightedEventId === event.id;
              const eventTime = 'timestamp' in event ? event.timestamp : event.startTime;

              // Render specifics per event type
              let iconNode = <Baby className="w-4 h-4 text-sage-600" />;
              let iconBg = 'bg-sage-100 dark:bg-sage-950 text-sage-600 dark:text-sage-400';
              let title = '';
              let details = '';

              if (event.type === 'feeding') {
                const f = event as FeedingEvent;
                if (f.feedType === 'nursing') {
                  iconNode = <Baby className="w-4 h-4" />;
                  iconBg = 'bg-sage-100 dark:bg-sage-950 text-sage-700 dark:text-sage-300';
                  title = 'Nursed';
                  details = `Left: ${Math.round((f.leftDurationSeconds || 0) / 60)}m • Right: ${Math.round((f.rightDurationSeconds || 0) / 60)}m (${Math.round((f.totalDurationSeconds || 0) / 60)}m total)`;
                } else {
                  iconNode = <Milk className="w-4 h-4" />;
                  iconBg = 'bg-sage-100 dark:bg-sage-950 text-sage-700 dark:text-sage-300';
                  title = `Bottle (${f.bottleType === 'formula' ? 'Formula' : 'Expressed Milk'})`;
                  details = formatVolume(f.volumeMl || 0, state.settings.bottleUnit);
                }
              } else if (event.type === 'diaper') {
                const d = event as DiaperEvent;
                iconNode = <Droplets className="w-4 h-4" />;
                iconBg = 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
                if (d.hasPee && d.hasPoop) {
                  title = 'Pee + Poop Diaper';
                  details = `Stool: ${d.poopConsistency || ''} • ${d.poopColor || ''}`;
                } else if (d.hasPoop) {
                  title = 'Dirty Diaper (Poop)';
                  details = `${d.poopConsistency || ''} • ${d.poopColor || ''}`;
                } else {
                  title = 'Wet Diaper (Pee)';
                  details = d.peeColor ? `Color: ${d.peeColor}` : 'Wet';
                }
              } else if (event.type === 'sleep') {
                const s = event as SleepEvent;
                iconNode = <Moon className="w-4 h-4" />;
                iconBg = 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300';
                title = 'Sleep Session';
                details = `${formatDuration(s.durationSeconds)} (${formatTime(s.startTime)} – ${formatTime(s.endTime)})`;
              } else if (event.type === 'temperature') {
                const t = event as TemperatureEvent;
                iconNode = <Thermometer className="w-4 h-4" />;
                iconBg = 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300';
                title = 'Temperature Check';
                details = formatTemperature(t.temperatureCelsius, state.settings.temperatureUnit);
              }

              return (
                <div
                  key={event.id}
                  id={`event-${event.id}`}
                  className={`p-3.5 rounded-2xl bg-white dark:bg-charcoal-800 border transition-all ${
                    isHighlighted
                      ? 'border-sage-500 ring-2 ring-sage-400 bg-sage-50/50 dark:bg-sage-950/30'
                      : 'border-warmgray-200 dark:border-charcoal-700 hover:border-warmgray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {iconNode}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {title}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 ml-2">
                            {formatTime(eventTime)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                          {details}
                        </p>
                        {event.recordedBy && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Recorded by {event.recordedBy.displayName}
                            {event.recordedBy.role === 'admin' ? ' · Admin' : ''}
                          </p>
                        )}
                        {event.note && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-1 bg-warmgray-50 dark:bg-charcoal-700/40 px-2 py-1 rounded-lg">
                            "{event.note}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(event);
                          if (event.type === 'feeding') openModal('feed');
                          else if (event.type === 'diaper') openModal('diaper');
                          else if (event.type === 'sleep') openModal('sleep');
                          else if (event.type === 'temperature') openModal('temperature');
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-warmgray-100 dark:hover:bg-charcoal-700 transition-colors"
                        aria-label="Edit record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(event.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-10 px-4 bg-white dark:bg-charcoal-800 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 space-y-3">
            <div className="w-12 h-12 rounded-full bg-sage-100 dark:bg-sage-950 text-sage-600 dark:text-sage-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No care activities logged today yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Log a feed, diaper, or sleep session to start tracking your baby's day.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => openModal('feed')}
                className="px-4 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium transition-colors"
              >
                Log Feed
              </button>
              <button
                type="button"
                onClick={() => openModal('diaper')}
                className="px-4 py-2 rounded-xl bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              >
                Log Diaper
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingId}
        title="Delete Activity Record"
        description={`Are you sure you want to remove this ${
          itemToDelete?.type || 'activity'
        } record? You can also undo immediately after deletion.`}
        onConfirm={() => {
          if (deletingId) deleteEvent(deletingId);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
