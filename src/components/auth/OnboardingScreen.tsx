// src/components/auth/OnboardingScreen.tsx
import React, { useState } from 'react';
import { Baby, Copy, Link2, Shield, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTracker } from '../../context/TrackerContext';
import { generateInviteCode, tryCreateBaby, tryJoinBaby, fetchFamilyMembers } from '../../utils/familyApi';
import { hasRealTrackerData } from '../../utils/emptyState';

export const OnboardingScreen: React.FC = () => {
  const { user, displayName } = useAuth();
  const { state, setupFamilyShare, exportData } = useTracker();
  const [step, setStep] = useState<'profile' | 'family'>('profile');
  const [babyName, setBabyName] = useState(state.profile.name || '');
  const [birthDate, setBirthDate] = useState(state.profile.birthDate || '');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState(generateInviteCode());
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const keptLocal = hasRealTrackerData(state);

  const goFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyName.trim() || !birthDate) {
      setError('Baby name and birth date are required');
      return;
    }
    setError(null);
    setStep('family');
  };

  const finishCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const rpc = await tryCreateBaby(babyName.trim(), birthDate);
      let babyId: string | undefined;
      let code = inviteCode.trim().toLowerCase();
      let members: Awaited<ReturnType<typeof fetchFamilyMembers>> | undefined;

      if (rpc.baby) {
        babyId = rpc.baby.id;
        code = rpc.baby.invite_code;
        members = await fetchFamilyMembers(rpc.baby.id);
      } else if (rpc.unsupported) {
        // Schema not applied yet — fall back to invite-code blob sync; this user is admin
        code = inviteCode.trim().toLowerCase() || generateInviteCode();
      } else if (rpc.error) {
        setError(rpc.error);
        return;
      }

      const res = await setupFamilyShare({
        role: 'admin',
        inviteCode: code,
        babyId,
        babyName: babyName.trim(),
        birthDate,
        members:
          members && members.length
            ? members
            : user
              ? [{ userId: user.id, displayName, role: 'admin' }]
              : [],
      });
      if (!res.success) setError(res.error || 'Could not create family');
    } finally {
      setBusy(false);
    }
  };

  const finishJoin = async () => {
    setBusy(true);
    setError(null);
    try {
      const code = joinCode.trim().toLowerCase();
      if (!code) {
        setError('Enter the family code from the admin');
        return;
      }

      const rpc = await tryJoinBaby(code);
      let babyId: string | undefined;
      let name = babyName.trim();
      let bdate = birthDate;
      let members: Awaited<ReturnType<typeof fetchFamilyMembers>> | undefined;

      if (rpc.baby) {
        babyId = rpc.baby.id;
        name = rpc.baby.name || name;
        bdate = rpc.baby.birth_date || bdate;
        members = await fetchFamilyMembers(rpc.baby.id);
      } else if (rpc.unsupported) {
        // blob join path
      } else if (rpc.error) {
        setError(rpc.error);
        return;
      }

      const res = await setupFamilyShare({
        role: 'caregiver',
        inviteCode: code,
        babyId,
        babyName: name,
        birthDate: bdate,
        members:
          members && members.length
            ? members
            : user
              ? [{ userId: user.id, displayName, role: 'caregiver' }]
              : [],
      });
      if (!res.success) setError(res.error || 'Could not join family');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-warmgray-100 dark:bg-charcoal-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 shadow-lg overflow-hidden">
        <div className="px-6 pt-8 pb-4 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-700 dark:text-sage-300 flex items-center justify-center">
            <Baby className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {step === 'profile' ? 'Set up baby profile' : 'Share with family'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {step === 'profile'
              ? 'One shared baby profile for everyone who cares for them.'
              : 'One admin per baby. Share the family code so partners can join.'}
          </p>
        </div>

        {keptLocal && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-xl bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-900 text-[11px] text-sage-800 dark:text-sage-200 flex items-center justify-between gap-2">
            <span>Existing records on this device were kept.</span>
            <button type="button" onClick={exportData} className="underline font-medium whitespace-nowrap">
              Download backup
            </button>
          </div>
        )}

        {step === 'profile' ? (
          <form onSubmit={goFamily} className="px-6 py-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Baby name
              </label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Birth date
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
              />
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold min-h-[48px]"
            >
              Continue
            </button>
          </form>
        ) : (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-1 p-1 bg-warmgray-200/70 dark:bg-charcoal-800 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 min-h-[44px] ${
                  mode === 'create'
                    ? 'bg-white dark:bg-charcoal-700 text-sage-800 dark:text-sage-100'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Create (Admin)
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className={`py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 min-h-[44px] ${
                  mode === 'join'
                    ? 'bg-white dark:bg-charcoal-700 text-sage-800 dark:text-sage-100'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Join family
              </button>
            </div>

            {mode === 'create' ? (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  You will be the <strong className="text-slate-700 dark:text-slate-200">admin</strong>. If two
                  people log a similar entry within 10 minutes, the admin&apos;s entry is kept.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="flex-1 px-3 py-2.5 font-mono text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(inviteCode)}
                    className="p-3 rounded-xl border border-warmgray-300 dark:border-charcoal-700 text-slate-600 dark:text-slate-300 min-h-[44px]"
                    aria-label="Copy code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={finishCreate}
                  className="w-full py-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold min-h-[48px] disabled:opacity-50"
                >
                  {busy ? 'Creating…' : 'Create family & continue'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                  <Link2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Enter the family code from the baby&apos;s admin account.
                </p>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. baby-4821"
                  className="w-full px-3 py-2.5 font-mono text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 min-h-[44px]"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={finishJoin}
                  className="w-full py-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold min-h-[48px] disabled:opacity-50"
                >
                  {busy ? 'Joining…' : 'Join & sync records'}
                </button>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => setStep('profile')}
              className="w-full text-xs text-slate-500 py-2"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
