// src/utils/units.ts
import { ActiveNursingSession } from '../types/tracker';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ================= VOLUME (ml <-> oz) =================
export const ML_PER_OZ = 29.5735;

export function mlToOz(ml: number): number {
  return Math.round((ml / ML_PER_OZ) * 10) / 10;
}

export function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_OZ);
}

export function formatVolume(volumeMl: number, unit: 'oz' | 'ml'): string {
  if (unit === 'oz') {
    const oz = mlToOz(volumeMl);
    return `${oz} oz`;
  }
  return `${Math.round(volumeMl)} ml`;
}

export function getConvertedVolumeSubtext(volumeMl: number, unit: 'oz' | 'ml'): string {
  if (unit === 'oz') {
    return `~${Math.round(volumeMl)} ml`;
  }
  const oz = mlToOz(volumeMl);
  return `~${oz} oz`;
}

// ================= TEMPERATURE (C <-> F) =================
export function celsiusToFahrenheit(c: number): number {
  return Math.round(((c * 9) / 5 + 32) * 10) / 10;
}

export function fahrenheitToCelsius(f: number): number {
  return Math.round((((f - 32) * 5) / 9) * 100) / 100;
}

export function isFever(tempCelsius: number): boolean {
  // 38°C or 100.4°F
  return tempCelsius >= 38.0;
}

export function formatTemperature(tempCelsius: number, unit: 'F' | 'C'): string {
  if (unit === 'F') {
    return `${celsiusToFahrenheit(tempCelsius).toFixed(1)}°F`;
  }
  return `${tempCelsius.toFixed(1)}°C`;
}

// ================= WEIGHT (grams <-> lb/oz / kg) =================
export function gramsToLbOz(grams: number): { lb: number; oz: number } {
  const totalOz = grams / 28.3495;
  const lb = Math.floor(totalOz / 16);
  const oz = Math.round((totalOz % 16) * 10) / 10;
  return { lb, oz };
}

export function lbOzToGrams(lb: number, oz: number): number {
  return Math.round((lb * 16 + oz) * 28.3495);
}

export function gramsToKg(grams: number): number {
  return Math.round((grams / 1000) * 100) / 100;
}

export function kgToGrams(kg: number): number {
  return Math.round(kg * 1000);
}

export function formatWeight(grams: number, unit: 'lb_oz' | 'kg'): string {
  if (unit === 'lb_oz') {
    const { lb, oz } = gramsToLbOz(grams);
    return `${lb} lb ${oz} oz`;
  }
  return `${(grams / 1000).toFixed(2)} kg`;
}

// ================= LENGTH & HEAD (cm <-> in) =================
export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10;
}

export function formatLength(cm: number, unit: 'in' | 'cm'): string {
  if (unit === 'in') {
    return `${cmToInches(cm).toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

// ================= TIME & DATE FORMATTING =================
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const weekdayDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export function formatTime(isoString: string): string {
  try {
    return timeFormatter.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    return dateFormatter.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatShortDate(isoString: string): string {
  try {
    return shortDateFormatter.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatWeekdayDate(isoString: string): string {
  try {
    return weekdayDateFormatter.format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return `${shortDateFormatter.format(d)}, ${timeFormatter.format(d)}`;
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string, now: Date = new Date()): string {
  try {
    const then = new Date(isoString);
    const diffMs = now.getTime() - then.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return days === 1 ? '1d ago' : `${days}d ago`;
  } catch {
    return 'Recently';
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hours > 0) {
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }
  if (mins > 0) {
    return `${mins}m`;
  }
  return `${secs}s`;
}

export function formatDurationMmSs(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}`;
}

export function calculateBabyAge(birthDateIso: string, targetDate: Date = new Date()): string {
  if (!birthDateIso) return '';
  try {
    const birth = new Date(birthDateIso);
    const diffMs = targetDate.getTime() - birth.getTime();
    if (diffMs < 0) return 'Newborn';
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} old`;
    }
    const weeks = Math.floor(diffDays / 7);
    const remDays = diffDays % 7;
    if (weeks < 8) {
      return remDays > 0 ? `${weeks}w ${remDays}d old` : `${weeks} weeks old`;
    }
    const months = Math.floor(diffDays / 30.4375);
    return `${months} ${months === 1 ? 'month' : 'months'} old`;
  } catch {
    return '';
  }
}

// Real-time calculation for active nursing session so timers remain 100% accurate
export function getActiveNursingTotals(
  session: ActiveNursingSession | null,
  nowTimestamp: number = Date.now()
): { leftSeconds: number; rightSeconds: number; totalSeconds: number } {
  if (!session) {
    return { leftSeconds: 0, rightSeconds: 0, totalSeconds: 0 };
  }

  let left = session.leftElapsedSeconds;
  let right = session.rightElapsedSeconds;

  if (!session.isPaused && session.activeSide && session.lastSideSwitchedAt) {
    const deltaSeconds = Math.max(0, Math.floor((nowTimestamp - new Date(session.lastSideSwitchedAt).getTime()) / 1000));
    if (session.activeSide === 'left') {
      left += deltaSeconds;
    } else {
      right += deltaSeconds;
    }
  }

  return {
    leftSeconds: left,
    rightSeconds: right,
    totalSeconds: left + right,
  };
}
