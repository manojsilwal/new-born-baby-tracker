// src/components/auth/AuthScreen.tsx
import React, { useState } from 'react';
import { Baby, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type Mode = 'signin' | 'signup';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) setError(res.error);
      } else {
        const res = await signUp(email, password, displayName);
        if (res.error) {
          if (res.error.toLowerCase().includes('confirm')) {
            setInfo(res.error);
          } else {
            setError(res.error);
          }
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmgray-100 dark:bg-charcoal-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 shadow-lg overflow-hidden">
        <div className="px-6 pt-8 pb-4 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-700 dark:text-sage-300 flex items-center justify-center">
            <Baby className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Newborn Tracker</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in with email to keep your baby&apos;s records safe and share with family.
          </p>
        </div>

        <div className="px-6 pb-2">
          <div className="grid grid-cols-2 gap-1 p-1 bg-warmgray-200/70 dark:bg-charcoal-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setInfo(null);
              }}
              className={`py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] ${
                mode === 'signin'
                  ? 'bg-white dark:bg-charcoal-700 text-sage-800 dark:text-sage-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setInfo(null);
              }}
              className={`py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 min-h-[44px] ${
                mode === 'signup'
                  ? 'bg-white dark:bg-charcoal-700 text-sage-800 dark:text-sage-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create account
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Mom, Dad, Nanny"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-sage-700 dark:text-sage-300 bg-sage-50 dark:bg-sage-950/40 px-3 py-2 rounded-xl">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold min-h-[48px] disabled:opacity-50"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};
