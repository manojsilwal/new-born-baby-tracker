// src/components/auth/OnboardingScreen.tsx
import React, { useState } from 'react';
import { Baby, Copy, Link2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTracker } from '../../context/TrackerContext';
import { generateInviteCode, tryCreateBaby, tryJoinBaby, fetchFamilyMembers } from '../../utils/familyApi';
import { scrollFocusedFieldIntoView } from '../../utils/scrollFocusedFieldIntoView';

type Props = {
  /** create = new newborn profile; join = enter family code only */
  intent?: 'create' | 'join';
  onBack?: () => void;
};

export const OnboardingScreen: React.FC<Props> = ({ intent = 'create', onBack }) => {
  const { user, displayName } = useAuth();
  const { setupFamilyShare, showBabyPicker } = useTracker();
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [inviteCode, setInviteCode] = useState(generateInviteCode());
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isJoin = intent === 'join';

  const finishCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyName.trim() || !birthDate) {
      setError('Baby name and birth date are required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const rpc = await tryCreateBaby(babyName.trim(), birthDate);
      let babyId: string | undefined;
      let code = inviteCode.trim().toLowerCase() || generateInviteCode();
      let members: Awaited<ReturnType<typeof fetchFamilyMembers>> | undefined;

      if (rpc.baby) {
        babyId = rpc.baby.id;
        code = rpc.baby.invite_code;
        members = await fetchFamilyMembers(rpc.baby.id);
      } else if (rpc.unsupported) {
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
      if (!res.success) setError(res.error || 'Could not create baby profile');
    } finally {
      setBusy(false);
    }
  };

  const finishJoin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      let name = 'Baby';
      let bdate = new Date().toISOString().slice(0, 10);
      let members: Awaited<ReturnType<typeof fetchFamilyMembers>> | undefined;

      if (rpc.baby) {
        babyId = rpc.baby.id;
        name = rpc.baby.name || name;
        bdate = rpc.baby.birth_date || bdate;
        members = await fetchFamilyMembers(rpc.baby.id);
      } else if (rpc.error && !rpc.unsupported) {
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

  const goBack = () => {
    if (onBack) onBack();
    else showBabyPicker();
  };

  const fieldClass =
    'w-full px-3 py-2.5 text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]';

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-y-auto overscroll-y-contain bg-warmgray-100 dark:bg-charcoal-900">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8 pb-40">
        <div className="w-full max-w-[420px] bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl border border-warmgray-200 dark:border-charcoal-700 shadow-lg overflow-hidden">
          <div className="px-6 pt-8 pb-4 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-700 dark:text-sage-300 flex items-center justify-center">
              <Baby className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isJoin ? 'Join a family' : 'Add newborn'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isJoin
                ? 'Enter the family code shared by the baby’s admin.'
                : 'Name and birth date create a new baby profile. You will be the admin.'}
            </p>
          </div>

          {isJoin ? (
            <form onSubmit={finishJoin} className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Family code
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onFocus={scrollFocusedFieldIntoView}
                  placeholder="e.g. baby-demo-family"
                  className={`${fieldClass} font-mono`}
                  required
                />
              </div>
              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-4 h-4" />
                {busy ? 'Joining…' : 'Join & open records'}
              </button>
              <button type="button" onClick={goBack} className="w-full text-xs text-slate-500 py-2">
                Back to baby list
              </button>
            </form>
          ) : (
            <form onSubmit={finishCreate} className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Baby name
                </label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  onFocus={scrollFocusedFieldIntoView}
                  placeholder="e.g. Baby Aria"
                  required
                  className={fieldClass}
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
                  onFocus={scrollFocusedFieldIntoView}
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Family code (share with partner)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    onFocus={scrollFocusedFieldIntoView}
                    className={`flex-1 font-mono ${fieldClass}`}
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
              </div>
              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-xl">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-sm font-semibold min-h-[48px] disabled:opacity-50"
              >
                {busy ? 'Creating…' : 'Create baby profile'}
              </button>
              <button type="button" onClick={goBack} className="w-full text-xs text-slate-500 py-2">
                Back to baby list
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
