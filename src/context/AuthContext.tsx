// src/context/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  displayName: string;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateEmail: (email: string) => Promise<{ error?: string; info?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateDisplayName: (name: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName?.trim() || email.split('@')[0] },
      },
    });
    if (error) return { error: error.message };
    if (!data.session && data.user) {
      return {
        error:
          'Account created. If email confirmation is enabled in Supabase, confirm your email then sign in.',
      };
    }
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateEmail = useCallback(async (email: string) => {
    const next = email.trim().toLowerCase();
    if (!next || !next.includes('@')) {
      return { error: 'Enter a valid email address' };
    }
    const { data, error } = await supabase.auth.updateUser({ email: next });
    if (error) return { error: error.message };
    if (data.user) setUser(data.user);
    return {
      info: 'If email confirmation is enabled, check your inbox (old and new) to confirm the change.',
    };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' };
    }
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    if (data.user) setUser(data.user);
    return {};
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { error: 'Display name cannot be empty' };
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: trimmed },
    });
    if (error) return { error: error.message };
    if (data.user) setUser(data.user);
    return {};
  }, []);

  const displayName = useMemo(() => {
    if (!user) return '';
    const meta = user.user_metadata?.display_name;
    if (typeof meta === 'string' && meta.trim()) return meta.trim();
    return user.email?.split('@')[0] || 'Caregiver';
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      displayName,
      signUp,
      signIn,
      signOut,
      updateEmail,
      updatePassword,
      updateDisplayName,
    }),
    [
      user,
      session,
      loading,
      displayName,
      signUp,
      signIn,
      signOut,
      updateEmail,
      updatePassword,
      updateDisplayName,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
