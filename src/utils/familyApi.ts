// src/utils/familyApi.ts
import { supabase } from './supabaseClient';
import { FamilyMember, MemberRole } from '../types/tracker';

export interface BabyRow {
  id: string;
  name: string;
  birth_date: string;
  invite_code: string;
  created_by: string;
}

/** Try normalized create_baby RPC; returns null if schema not applied yet. */
export async function tryCreateBaby(
  name: string,
  birthDate: string
): Promise<{ baby?: BabyRow; error?: string; unsupported?: boolean }> {
  const { data, error } = await supabase.rpc('create_baby', {
    p_name: name,
    p_birth_date: birthDate,
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('Could not find the function') || msg.includes('schema cache') || error.code === 'PGRST202') {
      return { unsupported: true, error: msg };
    }
    return { error: msg };
  }
  return { baby: data as BabyRow };
}

export async function tryJoinBaby(
  inviteCode: string
): Promise<{ baby?: BabyRow; error?: string; unsupported?: boolean }> {
  const { data, error } = await supabase.rpc('join_baby_by_invite_code', {
    p_code: inviteCode.trim().toLowerCase(),
  });
  if (error) {
    const msg = error.message || '';
    if (msg.includes('Could not find the function') || msg.includes('schema cache') || error.code === 'PGRST202') {
      return { unsupported: true, error: msg };
    }
    return { error: msg };
  }
  return { baby: data as BabyRow };
}

export async function fetchFamilyMembers(babyId: string): Promise<FamilyMember[]> {
  const { data: members, error } = await supabase
    .from('baby_members')
    .select('user_id, role, profiles(display_name, email)')
    .eq('baby_id', babyId);

  if (error || !members) return [];

  return members.map((m: any) => ({
    userId: m.user_id as string,
    role: m.role as MemberRole,
    displayName: m.profiles?.display_name || m.profiles?.email?.split('@')[0] || 'Caregiver',
    email: m.profiles?.email || undefined,
  }));
}

export function generateInviteCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `baby-${n}`;
}
