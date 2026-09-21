// src/types/tracker.ts

export type BottleType = 'expressed' | 'formula';
export type FeedType = 'nursing' | 'bottle';
export type NursingSide = 'left' | 'right';

export interface FeedingEvent {
  id: string;
  type: 'feeding';
  feedType: FeedType;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  // Nursing fields
  leftDurationSeconds?: number;
  rightDurationSeconds?: number;
  totalDurationSeconds?: number;
  lastActiveSide?: NursingSide;
  // Bottle fields
  volumeMl?: number; // Canonical storage in milliliters
  bottleType?: BottleType;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type PeeColor = 'clear' | 'pale-yellow' | 'dark-yellow' | 'concentrated-orange';
export type PoopConsistency = 'meconium' | 'seedy' | 'soft' | 'liquid' | 'hard';
export type PoopColor = 'black' | 'dark-green' | 'mustard-yellow' | 'brown' | 'clay-pale' | 'blood-tinged';

export interface DiaperEvent {
  id: string;
  type: 'diaper';
  timestamp: string; // ISO string
  hasPee: boolean;
  peeColor?: PeeColor;
  hasPoop: boolean;
  poopConsistency?: PoopConsistency;
  poopColor?: PoopColor;
  alertAcknowledged?: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SleepEvent {
  id: string;
  type: 'sleep';
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationSeconds: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemperatureEvent {
  id: string;
  type: 'temperature';
  timestamp: string; // ISO string
  temperatureCelsius: number; // Canonical storage in Celsius
  alertAcknowledged?: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type TrackerEvent = FeedingEvent | DiaperEvent | SleepEvent | TemperatureEvent;

export type NewTrackerEvent =
  | Omit<FeedingEvent, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<DiaperEvent, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<SleepEvent, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<TemperatureEvent, 'id' | 'createdAt' | 'updatedAt'>;

export interface Appointment {
  id: string;
  title: string;
  providerName: string;
  dateTime: string; // ISO string
  location?: string;
  questions: string[];
  providerInstructions?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthRecord {
  id: string;
  timestamp: string; // ISO string
  weightGrams?: number; // Canonical storage in grams
  lengthCm?: number; // Canonical storage in cm
  headCircumferenceCm?: number; // Canonical storage in cm
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type HealthNoteCategory = 'general' | 'medication' | 'vaccine' | 'symptom' | 'advice';

export interface HealthNote {
  id: string;
  timestamp: string; // ISO string
  category: HealthNoteCategory;
  title: string;
  details: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveNursingSession {
  activeSide: NursingSide | null;
  leftElapsedSeconds: number;
  rightElapsedSeconds: number;
  lastSideSwitchedAt: string | null; // ISO timestamp when current activeSide started
  startedAt: string; // ISO timestamp session was first created
  isPaused: boolean;
}

export interface ActiveSleepSession {
  startedAt: string; // ISO timestamp
}

export interface ActiveTimers {
  nursing: ActiveNursingSession | null;
  sleep: ActiveSleepSession | null;
}

export interface BabyProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  bottleUnit: 'oz' | 'ml';
  temperatureUnit: 'F' | 'C';
  weightUnit: 'lb_oz' | 'kg';
  lengthUnit: 'in' | 'cm';
  headUnit: 'in' | 'cm';
  // Supabase Cloud Storage & Multi-caregiver sync
  familySyncCode?: string;
  autoSyncEnabled?: boolean;
  lastSyncedAt?: string;
}

export interface AppState {
  schemaVersion: number;
  profile: BabyProfile;
  settings: AppSettings;
  events: TrackerEvent[];
  appointments: Appointment[];
  growthRecords: GrowthRecord[];
  healthNotes: HealthNote[];
  activeTimers: ActiveTimers;
}

export interface ExportPackage {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  data: AppState;
}
