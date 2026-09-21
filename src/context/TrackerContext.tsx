// src/context/TrackerContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  AppState,
  TrackerEvent,
  NewTrackerEvent,
  FeedingEvent,
  DiaperEvent,
  SleepEvent,
  Appointment,
  GrowthRecord,
  HealthNote,
  NursingSide,
  BottleType,
  AppSettings,
  BabyProfile,
  ExportPackage,
} from '../types/tracker';
import { createInitialMockState } from '../utils/mockData';
import { generateUUID, getActiveNursingTotals } from '../utils/units';
import {
  uploadStateToServer,
  fetchStateFromServer,
  mergeStates,
} from '../utils/supabaseSync';

export const STORAGE_KEY = 'newborn-tracker:v1';

export interface ToastData {
  id: string;
  message: string;
  undoAction?: () => void;
  undoLabel?: string;
  duration?: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface TrackerContextType {
  state: AppState;
  activeTab: 'today' | 'history' | 'health';
  setActiveTab: (tab: 'today' | 'history' | 'health') => void;
  toast: ToastData | null;
  showToast: (message: string, undoAction?: () => void, undoLabel?: string) => void;
  dismissToast: () => void;

  // Cloud Sync Status & Actions
  syncStatus: SyncStatus;
  syncWithServer: (customCode?: string) => Promise<{ success: boolean; error?: string }>;
  enableSync: (familyCode: string) => Promise<{ success: boolean; error?: string }>;
  disableSync: () => void;

  // Events CRUD
  addEvent: (event: NewTrackerEvent) => string;
  updateEvent: (event: TrackerEvent) => void;
  deleteEvent: (id: string) => void;

  // Quick Logs
  quickWetDiaper: () => void;
  quickBottleFeed: (volumeMl: number, bottleType?: BottleType) => void;

  // Active Nursing Timer
  startNursing: (side: NursingSide) => void;
  pauseNursing: () => void;
  resumeNursing: (side?: NursingSide) => void;
  switchNursingSide: () => void;
  finishAndSaveNursing: (note?: string, customStartTime?: string, customEndTime?: string) => void;
  cancelNursing: () => void;
  getLastNursingSide: () => NursingSide;

  // Active Sleep Timer
  startSleep: () => void;
  finishAndSaveSleep: (note?: string, customEndTime?: string) => void;
  cancelSleep: () => void;

  // Health Items
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;
  toggleAppointmentComplete: (id: string) => void;

  addGrowthRecord: (record: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGrowthRecord: (record: GrowthRecord) => void;
  deleteGrowthRecord: (id: string) => void;

  addHealthNote: (note: Omit<HealthNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateHealthNote: (note: HealthNote) => void;
  deleteHealthNote: (id: string) => void;

  // Settings & Profile
  updateProfile: (profile: Partial<BabyProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportData: () => void;
  importData: (jsonStr: string) => { success: boolean; error?: string };

  // Modal Open Triggers
  activeModal: 'feed' | 'diaper' | 'sleep' | 'temperature' | 'settings' | 'doctorSummary' | 'profile' | 'appointment' | 'growth' | 'healthNote' | null;
  openModal: (modal: 'feed' | 'diaper' | 'sleep' | 'temperature' | 'settings' | 'doctorSummary' | 'profile' | 'appointment' | 'growth' | 'healthNote') => void;
  closeModal: () => void;
  editingEvent: TrackerEvent | null;
  setEditingEvent: (event: TrackerEvent | null) => void;
  editingAppointment: Appointment | null;
  setEditingAppointment: (apt: Appointment | null) => void;
  editingGrowthRecord: GrowthRecord | null;
  setEditingGrowthRecord: (rec: GrowthRecord | null) => void;
  editingHealthNote: HealthNote | null;
  setEditingHealthNote: (note: HealthNote | null) => void;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage or mock
  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.events)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load state from localStorage, falling back to mock data', err);
    }
    const initial = createInitialMockState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {
      // Storage might be restricted
    }
    return initial;
  });

  // Active navigation tab (persisted in session)
  const [activeTab, setActiveTabState] = useState<'today' | 'history' | 'health'>(() => {
    const saved = sessionStorage.getItem('newborn-tracker-tab');
    if (saved === 'today' || saved === 'history' || saved === 'health') return saved;
    return 'today';
  });

  const setActiveTab = (tab: 'today' | 'history' | 'health') => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('newborn-tracker-tab', tab);
    } catch {}
  };

  // Toast System
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, undoAction?: () => void, undoLabel: string = 'Undo', duration = 5000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const toastId = generateUUID();
    setToast({
      id: toastId,
      message,
      undoAction,
      undoLabel,
      duration,
    });
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => (prev?.id === toastId ? null : prev));
    }, duration);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  // Modal triggers
  const [activeModal, setActiveModal] = useState<TrackerContextType['activeModal']>(null);
  const [editingEvent, setEditingEvent] = useState<TrackerEvent | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingGrowthRecord, setEditingGrowthRecord] = useState<GrowthRecord | null>(null);
  const [editingHealthNote, setEditingHealthNote] = useState<HealthNote | null>(null);

  const openModal = (modal: TrackerContextType['activeModal']) => setActiveModal(modal);
  const closeModal = () => {
    setActiveModal(null);
    setEditingEvent(null);
    setEditingAppointment(null);
    setEditingGrowthRecord(null);
    setEditingHealthNote(null);
  };

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncTimeoutRef = useRef<number | null>(null);

  // 2. Persist State to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving app state to localStorage', e);
    }
  }, [state]);

  // 3. Theme Synchronization
  useEffect(() => {
    const applyThemeClass = (theme: AppSettings['theme']) => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyThemeClass(state.settings.theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (state.settings.theme === 'system') {
        applyThemeClass('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [state.settings.theme]);

  // ================= CLOUD SYNC LOGIC =================
  const syncWithServer = useCallback(
    async (customCode?: string): Promise<{ success: boolean; error?: string }> => {
      const code = customCode || state.settings.familySyncCode;
      if (!code || !code.trim()) {
        return { success: false, error: 'No family sync code configured' };
      }

      setSyncStatus('syncing');

      // 1. Fetch remote state
      const remoteRes = await fetchStateFromServer(code);

      if (!remoteRes.success && remoteRes.error?.includes('No data found')) {
        // First time upload for this code
        const uploadRes = await uploadStateToServer(code, state);
        if (uploadRes.success) {
          const nowIso = new Date().toISOString();
          setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, lastSyncedAt: nowIso },
          }));
          setSyncStatus('synced');
          return { success: true };
        } else {
          setSyncStatus('error');
          return { success: false, error: uploadRes.error };
        }
      }

      if (!remoteRes.success || !remoteRes.state) {
        setSyncStatus('error');
        return { success: false, error: remoteRes.error };
      }

      // 2. Merge local + remote
      const merged = mergeStates(state, remoteRes.state);
      const nowIso = new Date().toISOString();
      const updatedState = {
        ...merged,
        settings: {
          ...merged.settings,
          familySyncCode: code,
          autoSyncEnabled: true,
          lastSyncedAt: nowIso,
        },
      };

      // 3. Upload merged back to server
      const uploadRes = await uploadStateToServer(code, updatedState);
      if (uploadRes.success) {
        setState(updatedState);
        setSyncStatus('synced');
        return { success: true };
      } else {
        setSyncStatus('error');
        return { success: false, error: uploadRes.error };
      }
    },
    [state]
  );

  const enableSync = useCallback(
    async (familyCode: string): Promise<{ success: boolean; error?: string }> => {
      const clean = familyCode.trim().toLowerCase();
      if (!clean) return { success: false, error: 'Please enter a family sync code' };

      const res = await syncWithServer(clean);
      if (res.success) {
        setState((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            familySyncCode: clean,
            autoSyncEnabled: true,
          },
        }));
        showToast('Connected to Supabase cloud sync');
      } else {
        showToast(`Sync error: ${res.error}`);
      }
      return res;
    },
    [syncWithServer, showToast]
  );

  const disableSync = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        familySyncCode: undefined,
        autoSyncEnabled: false,
      },
    }));
    setSyncStatus('idle');
    showToast('Cloud sync disabled');
  }, [showToast]);

  // Debounced background auto-sync when state changes
  useEffect(() => {
    if (state.settings.autoSyncEnabled && state.settings.familySyncCode) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = window.setTimeout(() => {
        uploadStateToServer(state.settings.familySyncCode!, state)
          .then((res) => {
            if (res.success) setSyncStatus('synced');
          })
          .catch(() => setSyncStatus('error'));
      }, 3000);
    }
  }, [state.events, state.appointments, state.growthRecords, state.healthNotes, state.profile]);

  // ================= CRUD: Tracker Events =================
  const addEvent = useCallback(
    (eventData: NewTrackerEvent): string => {
      const id = generateUUID();
      const now = new Date().toISOString();
      const newEvent: TrackerEvent = {
        ...eventData,
        id,
        createdAt: now,
        updatedAt: now,
      } as TrackerEvent;

      setState((prev) => ({
        ...prev,
        events: [newEvent, ...prev.events],
      }));

      // Set up undo
      showToast('Record logged successfully', () => {
        setState((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== id),
        }));
      });

      return id;
    },
    [showToast]
  );

  const updateEvent = useCallback(
    (updatedEvent: TrackerEvent) => {
      const previousEvent = state.events.find((e) => e.id === updatedEvent.id);
      const now = new Date().toISOString();
      const finalEvent = { ...updatedEvent, updatedAt: now };

      setState((prev) => ({
        ...prev,
        events: prev.events.map((e) => (e.id === updatedEvent.id ? finalEvent : e)),
      }));

      if (previousEvent) {
        showToast('Record updated', () => {
          setState((prev) => ({
            ...prev,
            events: prev.events.map((e) => (e.id === previousEvent.id ? previousEvent : e)),
          }));
        });
      }
    },
    [state.events, showToast]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      const target = state.events.find((e) => e.id === id);
      if (!target) return;

      setState((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
      }));

      showToast('Record deleted', () => {
        setState((prev) => ({
          ...prev,
          events: [target, ...prev.events],
        }));
      });
    },
    [state.events, showToast]
  );

  // ================= QUICK LOGS =================
  const quickWetDiaper = useCallback(() => {
    const id = generateUUID();
    const now = new Date().toISOString();
    const event: DiaperEvent = {
      id,
      type: 'diaper',
      timestamp: now,
      hasPee: true,
      peeColor: 'pale-yellow',
      hasPoop: false,
      createdAt: now,
      updatedAt: now,
    };

    setState((prev) => ({
      ...prev,
      events: [event, ...prev.events],
    }));

    showToast('Wet diaper logged', () => {
      setState((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
      }));
    });
  }, [showToast]);

  const quickBottleFeed = useCallback(
    (volumeMl: number, bottleType: BottleType = 'expressed') => {
      const id = generateUUID();
      const now = new Date().toISOString();
      const event: FeedingEvent = {
        id,
        type: 'feeding',
        feedType: 'bottle',
        startTime: now,
        endTime: now,
        volumeMl,
        bottleType,
        createdAt: now,
        updatedAt: now,
      };

      setState((prev) => ({
        ...prev,
        events: [event, ...prev.events],
      }));

      const displayVol = state.settings.bottleUnit === 'oz' ? `${Math.round((volumeMl / 29.5735) * 10) / 10} oz` : `${Math.round(volumeMl)} ml`;
      showToast(`Logged ${displayVol} bottle`, () => {
        setState((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== id),
        }));
      });
    },
    [state.settings.bottleUnit, showToast]
  );

  // ================= NURSING TIMER =================
  const getLastNursingSide = useCallback((): NursingSide => {
    const lastNursing = state.events.find(
      (e): e is FeedingEvent => e.type === 'feeding' && e.feedType === 'nursing' && !!e.lastActiveSide
    );
    // If baby last finished on Left, start next on Right (alternate)
    if (lastNursing?.lastActiveSide === 'left') return 'right';
    if (lastNursing?.lastActiveSide === 'right') return 'left';
    return 'left';
  }, [state.events]);

  const startNursing = useCallback((side: NursingSide) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      activeTimers: {
        ...prev.activeTimers,
        nursing: {
          activeSide: side,
          leftElapsedSeconds: 0,
          rightElapsedSeconds: 0,
          lastSideSwitchedAt: nowIso,
          startedAt: nowIso,
          isPaused: false,
        },
      },
    }));
  }, []);

  const pauseNursing = useCallback(() => {
    setState((prev) => {
      const current = prev.activeTimers.nursing;
      if (!current || current.isPaused) return prev;

      const now = Date.now();
      const totals = getActiveNursingTotals(current, now);

      return {
        ...prev,
        activeTimers: {
          ...prev.activeTimers,
          nursing: {
            ...current,
            leftElapsedSeconds: totals.leftSeconds,
            rightElapsedSeconds: totals.rightSeconds,
            lastSideSwitchedAt: null,
            isPaused: true,
          },
        },
      };
    });
  }, []);

  const resumeNursing = useCallback((side?: NursingSide) => {
    setState((prev) => {
      const current = prev.activeTimers.nursing;
      if (!current) return prev;
      const targetSide = side || current.activeSide || 'left';
      const nowIso = new Date().toISOString();

      return {
        ...prev,
        activeTimers: {
          ...prev.activeTimers,
          nursing: {
            ...current,
            activeSide: targetSide,
            lastSideSwitchedAt: nowIso,
            isPaused: false,
          },
        },
      };
    });
  }, []);

  const switchNursingSide = useCallback(() => {
    setState((prev) => {
      const current = prev.activeTimers.nursing;
      if (!current) return prev;

      const now = Date.now();
      const totals = getActiveNursingTotals(current, now);
      const newSide: NursingSide = current.activeSide === 'left' ? 'right' : 'left';
      const nowIso = new Date().toISOString();

      return {
        ...prev,
        activeTimers: {
          ...prev.activeTimers,
          nursing: {
            ...current,
            activeSide: newSide,
            leftElapsedSeconds: totals.leftSeconds,
            rightElapsedSeconds: totals.rightSeconds,
            lastSideSwitchedAt: nowIso,
            isPaused: false,
          },
        },
      };
    });
  }, []);

  const finishAndSaveNursing = useCallback(
    (note?: string, customStartTime?: string, customEndTime?: string) => {
      const current = state.activeTimers.nursing;
      if (!current) return;

      const now = Date.now();
      const totals = getActiveNursingTotals(current, now);

      if (totals.totalSeconds < 1) {
        showToast('Nursing session requires at least 1 second to save');
        return;
      }

      const id = generateUUID();
      const createdIso = new Date().toISOString();
      const startTime = customStartTime || current.startedAt;
      const endTime = customEndTime || createdIso;

      const newEvent: FeedingEvent = {
        id,
        type: 'feeding',
        feedType: 'nursing',
        startTime,
        endTime,
        leftDurationSeconds: totals.leftSeconds,
        rightDurationSeconds: totals.rightSeconds,
        totalDurationSeconds: totals.totalSeconds,
        lastActiveSide: current.activeSide || 'left',
        note: note?.trim() || undefined,
        createdAt: createdIso,
        updatedAt: createdIso,
      };

      setState((prev) => ({
        ...prev,
        events: [newEvent, ...prev.events],
        activeTimers: {
          ...prev.activeTimers,
          nursing: null,
        },
      }));

      showToast(`Saved nursing feed (${Math.round(totals.totalSeconds / 60)} min)`, () => {
        setState((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== id),
        }));
      });
    },
    [state.activeTimers.nursing, showToast]
  );

  const cancelNursing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeTimers: {
        ...prev.activeTimers,
        nursing: null,
      },
    }));
    showToast('Nursing session cancelled');
  }, [showToast]);

  // ================= SLEEP TIMER =================
  const startSleep = useCallback(() => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      activeTimers: {
        ...prev.activeTimers,
        sleep: {
          startedAt: nowIso,
        },
      },
    }));
    showToast('Sleep timer started');
  }, [showToast]);

  const finishAndSaveSleep = useCallback(
    (note?: string, customEndTime?: string) => {
      const current = state.activeTimers.sleep;
      if (!current) return;

      const startTime = current.startedAt;
      const endTime = customEndTime || new Date().toISOString();
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      const durationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

      if (durationSeconds < 1) {
        showToast('Sleep session requires at least 1 second');
        return;
      }

      const id = generateUUID();
      const nowIso = new Date().toISOString();
      const newEvent: SleepEvent = {
        id,
        type: 'sleep',
        startTime,
        endTime,
        durationSeconds,
        note: note?.trim() || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setState((prev) => ({
        ...prev,
        events: [newEvent, ...prev.events],
        activeTimers: {
          ...prev.activeTimers,
          sleep: null,
        },
      }));

      const mins = Math.round(durationSeconds / 60);
      showToast(`Saved sleep session (${mins} min)`, () => {
        setState((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== id),
        }));
      });
    },
    [state.activeTimers.sleep, showToast]
  );

  const cancelSleep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeTimers: {
        ...prev.activeTimers,
        sleep: null,
      },
    }));
    showToast('Sleep timer cancelled');
  }, [showToast]);

  // ================= APPOINTMENTS =================
  const addAppointment = useCallback(
    (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      const apt: Appointment = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        appointments: [apt, ...prev.appointments],
      }));
      showToast('Appointment added');
    },
    [showToast]
  );

  const updateAppointment = useCallback(
    (apt: Appointment) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) => (a.id === apt.id ? { ...apt, updatedAt: now } : a)),
      }));
      showToast('Appointment updated');
    },
    [showToast]
  );

  const deleteAppointment = useCallback(
    (id: string) => {
      const target = state.appointments.find((a) => a.id === id);
      if (!target) return;
      setState((prev) => ({
        ...prev,
        appointments: prev.appointments.filter((a) => a.id !== id),
      }));
      showToast('Appointment removed', () => {
        setState((prev) => ({
          ...prev,
          appointments: [target, ...prev.appointments],
        }));
      });
    },
    [state.appointments, showToast]
  );

  const toggleAppointmentComplete = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === id ? { ...a, isCompleted: !a.isCompleted, updatedAt: new Date().toISOString() } : a
      ),
    }));
  }, []);

  // ================= GROWTH RECORDS =================
  const addGrowthRecord = useCallback(
    (data: Omit<GrowthRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      const rec: GrowthRecord = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        growthRecords: [rec, ...prev.growthRecords].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
      }));
      showToast('Growth measurement added');
    },
    [showToast]
  );

  const updateGrowthRecord = useCallback(
    (rec: GrowthRecord) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        growthRecords: prev.growthRecords
          .map((r) => (r.id === rec.id ? { ...rec, updatedAt: now } : r))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      }));
      showToast('Measurement updated');
    },
    [showToast]
  );

  const deleteGrowthRecord = useCallback(
    (id: string) => {
      const target = state.growthRecords.find((r) => r.id === id);
      if (!target) return;
      setState((prev) => ({
        ...prev,
        growthRecords: prev.growthRecords.filter((r) => r.id !== id),
      }));
      showToast('Measurement removed', () => {
        setState((prev) => ({
          ...prev,
          growthRecords: [target, ...prev.growthRecords].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ),
        }));
      });
    },
    [state.growthRecords, showToast]
  );

  // ================= HEALTH NOTES =================
  const addHealthNote = useCallback(
    (data: Omit<HealthNote, 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = generateUUID();
      const now = new Date().toISOString();
      const note: HealthNote = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        healthNotes: [note, ...prev.healthNotes].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
      }));
      showToast('Health note saved');
    },
    [showToast]
  );

  const updateHealthNote = useCallback(
    (note: HealthNote) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        healthNotes: prev.healthNotes.map((n) => (n.id === note.id ? { ...note, updatedAt: now } : n)),
      }));
      showToast('Health note updated');
    },
    [showToast]
  );

  const deleteHealthNote = useCallback(
    (id: string) => {
      const target = state.healthNotes.find((n) => n.id === id);
      if (!target) return;
      setState((prev) => ({
        ...prev,
        healthNotes: prev.healthNotes.filter((n) => n.id !== id),
      }));
      showToast('Health note removed', () => {
        setState((prev) => ({
          ...prev,
          healthNotes: [target, ...prev.healthNotes],
        }));
      });
    },
    [state.healthNotes, showToast]
  );

  // ================= SETTINGS & PROFILE =================
  const updateProfile = useCallback((profile: Partial<BabyProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...profile },
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const resetToDemoData = useCallback(() => {
    const demoState = createInitialMockState();
    setState(demoState);
    showToast('Demo data reloaded');
  }, [showToast]);

  const clearAllData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      events: [],
      appointments: [],
      growthRecords: [],
      healthNotes: [],
      activeTimers: { nursing: null, sleep: null },
    }));
    showToast('All records cleared');
  }, [showToast]);

  const exportData = useCallback(() => {
    const pkg: ExportPackage = {
      app: 'Newborn Tracker',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = state.profile.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'baby';
    a.download = `newborn-tracker-${safeName}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON exported');
  }, [state, showToast]);

  const importData = useCallback(
    (jsonStr: string): { success: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(jsonStr);
        let importedState: AppState | null = null;
        if (parsed.data && parsed.data.schemaVersion === 1) {
          importedState = parsed.data;
        } else if (parsed.schemaVersion === 1 && Array.isArray(parsed.events)) {
          importedState = parsed;
        }

        if (!importedState || !Array.isArray(importedState.events)) {
          return { success: false, error: 'Invalid backup file format.' };
        }

        setState(importedState);
        showToast('Backup data successfully restored');
        return { success: true };
      } catch (err) {
        return { success: false, error: 'Unable to parse JSON file.' };
      }
    },
    [showToast]
  );

  return (
    <TrackerContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        dismissToast,
        syncStatus,
        syncWithServer,
        enableSync,
        disableSync,
        addEvent,
        updateEvent,
        deleteEvent,
        quickWetDiaper,
        quickBottleFeed,
        startNursing,
        pauseNursing,
        resumeNursing,
        switchNursingSide,
        finishAndSaveNursing,
        cancelNursing,
        getLastNursingSide,
        startSleep,
        finishAndSaveSleep,
        cancelSleep,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        toggleAppointmentComplete,
        addGrowthRecord,
        updateGrowthRecord,
        deleteGrowthRecord,
        addHealthNote,
        updateHealthNote,
        deleteHealthNote,
        updateProfile,
        updateSettings,
        resetToDemoData,
        clearAllData,
        exportData,
        importData,
        activeModal,
        openModal,
        closeModal,
        editingEvent,
        setEditingEvent,
        editingAppointment,
        setEditingAppointment,
        editingGrowthRecord,
        setEditingGrowthRecord,
        editingHealthNote,
        setEditingHealthNote,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = (): TrackerContextType => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
