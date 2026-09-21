// src/utils/emptyState.ts
import { AppState } from '../types/tracker';

export function createEmptyInitialState(): AppState {
  return {
    schemaVersion: 1,
    profile: {
      name: '',
      birthDate: '',
    },
    settings: {
      theme: 'system',
      bottleUnit: 'oz',
      temperatureUnit: 'F',
      weightUnit: 'lb_oz',
      lengthUnit: 'in',
      headUnit: 'in',
    },
    activeTimers: {
      nursing: null,
      sleep: null,
    },
    events: [],
    appointments: [],
    growthRecords: [],
    healthNotes: [],
    familyMembers: [],
  };
}

/** True if state looks like real caregiver data (not a blank slate). */
export function hasRealTrackerData(state: AppState | null | undefined): boolean {
  if (!state) return false;
  if (state.events?.length > 0) return true;
  if (state.appointments?.length > 0) return true;
  if (state.growthRecords?.length > 0) return true;
  if (state.healthNotes?.length > 0) return true;
  if (state.settings?.familySyncCode) return true;
  if (state.settings?.babyId) return true;
  if (state.profile?.name?.trim() && state.profile?.birthDate) return true;
  return false;
}

export const LEGACY_STORAGE_KEY = 'newborn-tracker:v1';
export const LEGACY_CLAIM_KEY = 'newborn-tracker:legacy-claimed-by';
export const LEGACY_BACKUP_KEY = 'newborn-tracker:v1:backup';

export function userStorageKey(userId: string): string {
  return `newborn-tracker:v1:${userId}`;
}
