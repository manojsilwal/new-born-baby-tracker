// src/components/modals/SettingsModal.tsx
import React, { useState, useRef } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  HelpCircle,
  Baby,
  Cloud,
  RefreshCw,
  Copy,
  LogOut,
  Shield,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    state,
    closeModal,
    updateSettings,
    exportData,
    importData,
    resetToDemoData,
    clearAllData,
    openModal,
    syncStatus,
    syncWithServer,
    enableSync,
    disableSync,
    showToast,
  } = useTracker();
  const { user, displayName, signOut } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Sync state
  const [syncCodeInput, setSyncCodeInput] = useState<string>(
    state.settings.familySyncCode || ''
  );
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectSync = async () => {
    if (!syncCodeInput.trim()) return;
    setIsConnecting(true);
    await enableSync(syncCodeInput.trim());
    setIsConnecting(false);
  };

  const handleGenerateCode = () => {
    const randomCode = `maya-${Math.floor(1000 + Math.random() * 9000)}`;
    setSyncCodeInput(randomCode);
  };

  const handleCopyCode = () => {
    if (state.settings.familySyncCode) {
      navigator.clipboard.writeText(state.settings.familySyncCode);
      showToast('Family code copied to clipboard');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importData(content);
        if (!res.success) {
          alert(res.error || 'Failed to import backup file.');
        } else {
          closeModal();
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="w-full max-w-md bg-warmgray-50 dark:bg-charcoal-850 rounded-3xl shadow-2xl border border-warmgray-200 dark:border-charcoal-700 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-warmgray-200 dark:border-charcoal-700 bg-warmgray-100/50 dark:bg-charcoal-800/50">
          <h2 id="settings-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Settings & Preferences
          </h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-warmgray-200 dark:hover:bg-charcoal-700 transition-colors"
            aria-label="Close settings dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* Baby Profile Shortcut */}
          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-warmgray-200 dark:border-charcoal-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-600 dark:text-sage-400 flex items-center justify-center">
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {state.profile.name || 'Baby'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {state.profile.birthDate ? `Born ${state.profile.birthDate}` : 'No birth date set'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                closeModal();
                openModal('profile');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-warmgray-100 dark:bg-charcoal-700 text-slate-700 dark:text-slate-200 hover:bg-warmgray-200 transition-colors min-h-[36px]"
            >
              Edit
            </button>
          </div>

          {/* ================= CLOUD SERVER STORAGE & MULTI-CAREGIVER SYNC ================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-sage-600" />
                <span>Supabase Cloud Server Storage</span>
              </label>
              {state.settings.familySyncCode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Active</span>
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-warmgray-200 dark:border-charcoal-700 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect your free Supabase cloud database to persist records on the server and keep both parents or
                caregivers automatically in sync.
              </p>

              {state.settings.familySyncCode ? (
                /* Connected State */
                <div className="space-y-3">
                  <div className="p-3 bg-warmgray-50 dark:bg-charcoal-750 rounded-xl border border-warmgray-200 dark:border-charcoal-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Active Family Code</span>
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 uppercase">
                        {state.settings.familySyncCode}
                      </span>
                      {state.settings.memberRole && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700 dark:text-sage-300">
                          <Shield className="w-3 h-3" />
                          Your role: {state.settings.memberRole === 'admin' ? 'Admin' : 'Caregiver'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-2 rounded-lg bg-warmgray-200 dark:bg-charcoal-650 text-slate-600 dark:text-slate-300 hover:bg-warmgray-300 transition-colors"
                        title="Copy Family Code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {syncStatus === 'syncing' ? (
                        <span className="flex items-center space-x-1 text-sage-600">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Syncing with server...</span>
                        </span>
                      ) : state.settings.lastSyncedAt ? (
                        <span>Last synced: {new Date(state.settings.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span>Connected to Supabase</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => syncWithServer()}
                      disabled={syncStatus === 'syncing'}
                      className="px-3 py-1.5 rounded-lg bg-sage-600 hover:bg-sage-700 text-white font-medium text-xs flex items-center space-x-1 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>Sync Now</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-warmgray-100 dark:border-charcoal-700 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Share this code with your partner</span>
                    <button
                      type="button"
                      onClick={disableSync}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Disconnect Cloud
                    </button>
                  </div>
                </div>
              ) : (
                /* Setup State */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Family Sync Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="e.g. maya-family-4821"
                        value={syncCodeInput}
                        onChange={(e) => setSyncCodeInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="px-3 py-2 text-xs font-medium rounded-xl border border-warmgray-300 dark:border-charcoal-700 text-slate-700 dark:text-slate-300 hover:bg-warmgray-100 min-h-[44px] whitespace-nowrap"
                      >
                        Generate Code
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectSync}
                    disabled={!syncCodeInput.trim() || isConnecting}
                    className="w-full py-2.5 px-4 rounded-xl bg-sage-600 hover:bg-sage-700 text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Enable Server Storage & Sync</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Appearance & Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all min-h-[44px] ${
                  state.settings.theme === 'light'
                    ? 'border-sage-500 bg-sage-50 dark:bg-sage-950/40 text-sage-800 dark:text-sage-200 font-semibold ring-1 ring-sage-500'
                    : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="text-xs">Light</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all min-h-[44px] ${
                  state.settings.theme === 'dark'
                    ? 'border-sage-500 bg-sage-50 dark:bg-sage-950/40 text-sage-800 dark:text-sage-200 font-semibold ring-1 ring-sage-500'
                    : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span className="text-xs">Night (Dark)</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'system' })}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all min-h-[44px] ${
                  state.settings.theme === 'system'
                    ? 'border-sage-500 bg-sage-50 dark:bg-sage-950/40 text-sage-800 dark:text-sage-200 font-semibold ring-1 ring-sage-500'
                    : 'border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>

          {/* Unit Preferences */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Measurement Units
            </label>
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-warmgray-200 dark:border-charcoal-700 divide-y divide-warmgray-100 dark:divide-charcoal-700">
              {/* Bottle unit */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Bottle Volume</span>
                  <span className="text-xs text-slate-400 block">Default unit for bottles</span>
                </div>
                <div className="flex items-center space-x-1 bg-warmgray-100 dark:bg-charcoal-700 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateSettings({ bottleUnit: 'oz' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.bottleUnit === 'oz'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    oz
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ bottleUnit: 'ml' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.bottleUnit === 'ml'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    ml
                  </button>
                </div>
              </div>

              {/* Temperature unit */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Temperature</span>
                  <span className="text-xs text-slate-400 block">Fever check scale</span>
                </div>
                <div className="flex items-center space-x-1 bg-warmgray-100 dark:bg-charcoal-700 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateSettings({ temperatureUnit: 'F' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.temperatureUnit === 'F'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    °F
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ temperatureUnit: 'C' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.temperatureUnit === 'C'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    °C
                  </button>
                </div>
              </div>

              {/* Weight unit */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Weight</span>
                  <span className="text-xs text-slate-400 block">Growth checkups</span>
                </div>
                <div className="flex items-center space-x-1 bg-warmgray-100 dark:bg-charcoal-700 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateSettings({ weightUnit: 'lb_oz' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.weightUnit === 'lb_oz'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    lb & oz
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ weightUnit: 'kg' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.weightUnit === 'kg'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    kg
                  </button>
                </div>
              </div>

              {/* Length unit */}
              <div className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Length & Head Circ</span>
                  <span className="text-xs text-slate-400 block">Height and circumference</span>
                </div>
                <div className="flex items-center space-x-1 bg-warmgray-100 dark:bg-charcoal-700 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateSettings({ lengthUnit: 'in', headUnit: 'in' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.lengthUnit === 'in'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    in
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ lengthUnit: 'cm', headUnit: 'cm' })}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      state.settings.lengthUnit === 'cm'
                        ? 'bg-white dark:bg-charcoal-600 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    cm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Data Backup & Restore
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportData}
                className="p-3 rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center space-x-2 hover:bg-warmgray-50 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                <span>Export JSON Backup</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl border border-warmgray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center space-x-2 hover:bg-warmgray-50 min-h-[44px]"
              >
                <Upload className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                <span>Restore from JSON</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </div>

          {/* Data Reset and Management */}
          <div className="space-y-2 pt-2 border-t border-warmgray-200 dark:border-charcoal-700">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Data Management
            </label>
            <div className="space-y-2">
              {confirmReset ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                  <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                    Reload 24-hour realistic sample demo data? This will overwrite existing records.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetToDemoData();
                        setConfirmReset(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
                    >
                      Confirm Reload Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 rounded-lg bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full p-3 rounded-xl border border-warmgray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center justify-center space-x-2 hover:bg-warmgray-100 transition-colors min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Reset to Demo Data</span>
                </button>
              )}

              {confirmClear ? (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2">
                  <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                    Permanently delete all baby care events and records? This cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        clearAllData();
                        setConfirmClear(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                    >
                      Confirm Delete All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 rounded-lg bg-warmgray-200 dark:bg-charcoal-700 text-slate-700 dark:text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-charcoal-800 text-rose-600 dark:text-rose-400 font-medium text-xs flex items-center justify-center space-x-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Data</span>
                </button>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="space-y-2 pt-2 border-t border-warmgray-200 dark:border-charcoal-700">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Account
            </label>
            <div className="p-3 rounded-xl bg-white dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                Signed in as{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {displayName || user?.email}
                </span>
              </p>
              <p className="text-[11px] text-slate-400">
                Sign out keeps your records on this device. Sign back in with the same email to continue.
              </p>
              <button
                type="button"
                onClick={async () => {
                  closeModal();
                  await signOut();
                }}
                className="w-full py-2.5 rounded-xl border border-warmgray-300 dark:border-charcoal-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 min-h-[44px] hover:bg-warmgray-50 dark:hover:bg-charcoal-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          </div>

          {/* Privacy & Medical Disclaimers */}
          <div className="pt-2 border-t border-warmgray-200 dark:border-charcoal-700 space-y-3">
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-sage-50/70 dark:bg-sage-950/30 border border-sage-200 dark:border-sage-900/50 text-xs text-sage-900 dark:text-sage-300">
              <ShieldCheck className="w-4 h-4 text-sage-600 dark:text-sage-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Secure Storage & Privacy</span>
                Records are cached in your local browser and synced to your dedicated Supabase server database when
                configured. Duplicate care entries within 10 minutes keep the admin&apos;s version.
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-warmgray-100 dark:bg-charcoal-800 border border-warmgray-200 dark:border-charcoal-700 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                  Medical Disclaimer
                </span>
                Newborn Tracker is an informational care-tracking utility for parents and caregivers. It is not a
                medical device and does not diagnose, treat, or evaluate medical conditions. Always seek the advice of
                your pediatrician or other qualified healthcare provider with any questions regarding your baby’s
                health.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
