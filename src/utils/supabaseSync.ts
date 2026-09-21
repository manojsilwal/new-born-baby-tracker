// src/utils/supabaseSync.ts
import { AppState, MemberRole, TrackerEvent } from '../types/tracker';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseClient';
import { mergeStatesPreferAdmin } from './eventMerge';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

/**
 * Upload local AppState to Supabase server storage for a given family code
 */
export async function uploadStateToServer(
  familyCode: string,
  state: AppState
): Promise<{ success: boolean; error?: string }> {
  if (!familyCode || !familyCode.trim()) {
    return { success: false, error: 'Family sync code cannot be empty' };
  }

  try {
    const cleanCode = familyCode.trim().toLowerCase();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/baby_tracker_families`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        family_code: cleanCode,
        state_data: state,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || `Server returned ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network request failed' };
  }
}

/**
 * Fetch remote AppState from Supabase server storage for a given family code
 */
export async function fetchStateFromServer(
  familyCode: string
): Promise<{ success: boolean; state?: AppState; error?: string }> {
  if (!familyCode || !familyCode.trim()) {
    return { success: false, error: 'Family sync code cannot be empty' };
  }

  try {
    const cleanCode = familyCode.trim().toLowerCase();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/baby_tracker_families?family_code=eq.${encodeURIComponent(cleanCode)}`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      return { success: false, error: `Failed to fetch from server (${res.status})` };
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, error: 'No data found for this family code yet' };
    }

    const remoteData = rows[0].state_data as AppState;
    if (!remoteData || !Array.isArray(remoteData.events)) {
      return { success: false, error: 'Invalid state format received from server' };
    }

    return { success: true, state: remoteData };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error fetching from server' };
  }
}

/**
 * Find cloud family blobs that list this user as a member (by userId or email).
 * Used after login so caregivers land on their shared baby without re-entering profile.
 */
export async function discoverFamiliesForUser(
  userId: string,
  email?: string | null
): Promise<Array<{ familyCode: string; state: AppState; role: MemberRole }>> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/baby_tracker_families?select=family_code,state_data,updated_at&order=updated_at.desc&limit=50`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];

    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    const emailLower = email?.trim().toLowerCase() || '';
    const matches: Array<{ familyCode: string; state: AppState; role: MemberRole }> = [];

    for (const row of rows) {
      const state = row.state_data as AppState | undefined;
      if (!state || !Array.isArray(state.events)) continue;
      const members = state.familyMembers || [];
      const member = members.find(
        (m) =>
          m.userId === userId ||
          (!!emailLower && !!m.email && m.email.toLowerCase() === emailLower)
      );
      if (!member) continue;
      matches.push({
        familyCode: String(row.family_code || state.settings?.familySyncCode || '').toLowerCase(),
        state,
        role: member.role === 'admin' ? 'admin' : 'caregiver',
      });
    }

    return matches.filter((m) => m.familyCode);
  } catch {
    return [];
  }
}

/**
 * Merge local and remote AppState with admin-wins within a 10-minute duplicate window.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  return mergeStatesPreferAdmin(local, remote);
}

export type { TrackerEvent };
