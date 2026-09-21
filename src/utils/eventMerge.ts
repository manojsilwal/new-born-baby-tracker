// src/utils/eventMerge.ts
import { AppState, MemberRole, TrackerEvent } from '../types/tracker';

/** Duplicates of the same care type within this window prefer the admin's entry. */
export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

function eventAnchorTime(e: TrackerEvent): number {
  const iso = 'timestamp' in e ? e.timestamp : e.startTime;
  return new Date(iso).getTime();
}

function isAdminRole(role?: MemberRole): boolean {
  return role === 'admin';
}

/**
 * Prefer admin's event when two entries of the same type fall within 10 minutes.
 * Keeps the admin row; drops the caregiver duplicate. If both/neither are admin,
 * keeps the one with the later updatedAt (then higher id as tiebreak).
 */
export function resolveDuplicateEvents(events: TrackerEvent[]): TrackerEvent[] {
  const sorted = [...events].sort((a, b) => eventAnchorTime(a) - eventAnchorTime(b));
  const kept: TrackerEvent[] = [];
  const suppressed = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (suppressed.has(a.id)) continue;

    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (suppressed.has(b.id)) continue;
      if (a.type !== b.type) continue;

      const delta = Math.abs(eventAnchorTime(b) - eventAnchorTime(a));
      if (delta > DUPLICATE_WINDOW_MS) break;

      // Feeding: treat nursing vs bottle as different (not duplicates)
      if (a.type === 'feeding' && b.type === 'feeding') {
        if (a.feedType !== b.feedType) continue;
      }

      const aAdmin = isAdminRole(a.recordedBy?.role);
      const bAdmin = isAdminRole(b.recordedBy?.role);

      let dropId: string;
      if (aAdmin && !bAdmin) {
        dropId = b.id;
      } else if (bAdmin && !aAdmin) {
        dropId = a.id;
      } else {
        const aUp = new Date(a.updatedAt || a.createdAt).getTime();
        const bUp = new Date(b.updatedAt || b.createdAt).getTime();
        dropId = aUp >= bUp ? b.id : a.id;
      }

      suppressed.add(dropId);
      if (dropId === a.id) break;
    }

    if (!suppressed.has(a.id)) kept.push(a);
  }

  return kept.sort((a, b) => eventAnchorTime(b) - eventAnchorTime(a));
}

/**
 * Merge two AppStates: union by id, then apply admin-wins duplicate window on events.
 */
export function mergeStatesPreferAdmin(local: AppState, remote: AppState): AppState {
  const eventMap = new Map<string, TrackerEvent>();
  local.events.forEach((e) => eventMap.set(e.id, e));
  remote.events.forEach((remoteEvent) => {
    const localEvent = eventMap.get(remoteEvent.id);
    if (!localEvent) {
      eventMap.set(remoteEvent.id, remoteEvent);
    } else {
      const localTime = new Date(localEvent.updatedAt || '1970-01-01').getTime();
      const remoteTime = new Date(remoteEvent.updatedAt || '1970-01-01').getTime();
      // Same id: prefer admin version if roles differ; else newer updatedAt
      const localAdmin = isAdminRole(localEvent.recordedBy?.role);
      const remoteAdmin = isAdminRole(remoteEvent.recordedBy?.role);
      if (remoteAdmin && !localAdmin) {
        eventMap.set(remoteEvent.id, remoteEvent);
      } else if (localAdmin && !remoteAdmin) {
        // keep local
      } else if (remoteTime > localTime) {
        eventMap.set(remoteEvent.id, remoteEvent);
      }
    }
  });

  const aptMap = new Map(local.appointments.map((a) => [a.id, a]));
  remote.appointments.forEach((a) => {
    const existing = aptMap.get(a.id);
    if (!existing || new Date(a.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      aptMap.set(a.id, a);
    }
  });

  const growthMap = new Map(local.growthRecords.map((g) => [g.id, g]));
  remote.growthRecords.forEach((g) => {
    const existing = growthMap.get(g.id);
    if (!existing || new Date(g.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      growthMap.set(g.id, g);
    }
  });

  const notesMap = new Map(local.healthNotes.map((n) => [n.id, n]));
  remote.healthNotes.forEach((n) => {
    const existing = notesMap.get(n.id);
    if (!existing || new Date(n.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      notesMap.set(n.id, n);
    }
  });

  const memberMap = new Map(
    [...(local.familyMembers || []), ...(remote.familyMembers || [])].map((m) => [m.userId, m])
  );

  const mergedEvents = resolveDuplicateEvents(Array.from(eventMap.values()));

  return {
    ...local,
    profile: {
      name: remote.profile.name || local.profile.name,
      birthDate: remote.profile.birthDate || local.profile.birthDate,
    },
    settings: {
      ...local.settings,
      ...remote.settings,
      familySyncCode: remote.settings.familySyncCode || local.settings.familySyncCode,
      babyId: remote.settings.babyId || local.settings.babyId,
      memberRole: local.settings.memberRole || remote.settings.memberRole,
    },
    events: mergedEvents,
    appointments: Array.from(aptMap.values()).sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    ),
    growthRecords: Array.from(growthMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    healthNotes: Array.from(notesMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    familyMembers: Array.from(memberMap.values()),
  };
}
