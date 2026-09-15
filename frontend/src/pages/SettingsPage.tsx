import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Lock,
  Fingerprint,
  Bell,
  Database,
  Download,
  Upload,
  Globe,
  DollarSign,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Share,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { useAuthPin } from '../context/AuthPinContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AlertsSettings } from '../components/Settings/AlertsSettings';
import * as api from '../services/api';

export const SettingsPage: React.FC = () => {
  const { theme, setThemeMode } = useTheme();
  const { currency, updateCurrency, triggerNotification, refreshData } = useFinance();
  const { pinRequired, setPin, biometricAvailable, biometricEnabled, enableBiometric, disableBiometric } = useAuthPin();
  const { installed: pwaInstalled, isIOS, canPromptInstall, promptInstall } = usePWAInstall();

  const [newPinInput, setNewPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [dataBusy, setDataBusy] = useState<'backup' | 'restore' | null>(null);
  const [dataMsg, setDataMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleToggleBiometric = async () => {
    setBiometricError(null);
    if (biometricEnabled) {
      if (confirm('Turn off Face ID / Fingerprint unlock? You’ll only be able to unlock with your PIN.')) {
        disableBiometric();
      }
      return;
    }
    setBiometricBusy(true);
    const result = await enableBiometric();
    setBiometricBusy(false);
    if (!result.ok) setBiometricError(result.error || 'Could not set up Face ID / Fingerprint.');
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length === 4) {
      setPin(newPinInput);
      setNewPinInput('');
      setShowPinSetup(false);
      alert('Security PIN setup successfully!');
    } else {
      alert('PIN must be 4 digits.');
    }
  };

  const handleDisablePin = () => {
    if (confirm('Remove Security PIN lock?')) {
      setPin(null);
    }
  };

  const handleRequestNotifications = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          triggerNotification(
            'Smart Finance Notifications Enabled!',
            'You will receive browser notifications for due dates and bills.'
          );
        }
      });
    }
  };

  const flashData = (ok: boolean, text: string) => {
    setDataMsg({ ok, text });
    window.setTimeout(() => setDataMsg(null), 6000);
  };

  const handleBackup = async () => {
    setDataBusy('backup');
    try {
      await api.downloadBackup();
      flashData(true, 'Saved. Choose "Save to Files" to keep it on your iPhone.');
    } catch (e: any) {
      flashData(false, e.message || 'Backup failed');
    } finally {
      setDataBusy(null);
    }
  };

  const handleRestoreFile = async (file: File) => {
    if (!confirm('Restore will replace all current data with the contents of this backup file. Continue?')) return;
    setDataBusy('restore');
    try {
      const { restored } = await api.restoreBackup(file);
      await refreshData();
      flashData(true, `Restored ${restored} record${restored === 1 ? '' : 's'} from backup.`);
    } catch (e: any) {
      flashData(false, e.message || 'That file could not be read as a SMT-C backup.');
    } finally {
      setDataBusy(null);
    }
  };

  return (
    <div className="space-y-5 pb-nav max-w-4xl mx-auto px-4 pt-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings & Preferences</h1>
          <p className="text-xs text-gray-500">Theme, Currency, Security PIN & Database Backup</p>
        </div>
      </div>

      {/* 1. Theme & Appearance */}
      <div className="p-5 rounded-2xl liquid-glass-card space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appearance & Theme</h2>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setThemeMode('light')}
            className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
              theme === 'light'
                ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
            }`}
          >
            <Sun className="w-5 h-5" />
            <span className="text-xs font-bold">Light</span>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
              theme === 'dark'
                ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
            }`}
          >
            <Moon className="w-5 h-5" />
            <span className="text-xs font-bold">Slate Dark</span>
          </button>

          <button
            onClick={() => setThemeMode('amoled')}
            className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
              theme === 'amoled'
                ? 'bg-slate-950 text-emerald-400 border-emerald-500 shadow-md shadow-emerald-500/20 font-bold'
                : 'bg-black text-slate-300 border-slate-800'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-black border border-emerald-400"></div>
            <span className="text-xs font-bold">AMOLED Black</span>
          </button>
        </div>
      </div>

      {/* 2. Currency Selector */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Currency Symbol</h2>
        <div className="grid grid-cols-3 gap-2">
          {['₹', '$', '€'].map((sym) => (
            <button
              key={sym}
              onClick={() => updateCurrency(sym)}
              className={`py-3 rounded-xl border text-base font-bold transition-all ${
                currency === sym
                  ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
              }`}
            >
              {sym} {sym === '₹' ? '(INR)' : sym === '$' ? '(USD)' : '(EUR)'}
            </button>
          ))}
        </div>
      </div>

      {/* 2b. App Installation */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">App Installation</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <Smartphone className="w-5 h-5 text-brand-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {pwaInstalled ? 'Installed as an app' : 'Install SMT-C'}
              </p>
              <p className="text-[11px] text-gray-500">
                {pwaInstalled
                  ? 'Running full-screen from your Home Screen'
                  : 'Full-screen, offline-ready, no browser chrome'}
              </p>
            </div>
          </div>
          {pwaInstalled ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : canPromptInstall ? (
            <button
              onClick={() => promptInstall()}
              className="shrink-0 px-3 py-1.5 min-h-[2.5rem] rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-sm"
            >
              Install
            </button>
          ) : null}
        </div>

        {!pwaInstalled && !canPromptInstall && (
          <p className="text-[11px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center gap-1 flex-wrap">
            {isIOS ? (
              <>
                Tap <Share className="w-3.5 h-3.5 inline text-brand-600" aria-hidden="true" /> <span className="font-semibold">Share</span> in Safari, then{' '}
                <span className="font-semibold">Add to Home Screen</span>.
              </>
            ) : (
              'Open your browser menu and choose "Install app" or "Add to Home Screen".'
            )}
          </p>
        )}
      </div>

      {/* 3. Security PIN Lock */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Security & Privacy</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="w-5 h-5 text-brand-600" />
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">Security PIN Lock</p>
              <p className="text-[11px] text-gray-500">Protect financial records on device launch</p>
            </div>
          </div>
          {pinRequired ? (
            <button
              onClick={handleDisablePin}
              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 text-xs font-semibold"
            >
              Disable PIN
            </button>
          ) : (
            <button
              onClick={() => setShowPinSetup(true)}
              className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-sm"
            >
              Set PIN
            </button>
          )}
        </div>

        {showPinSetup && (
          <form onSubmit={handleSavePin} className="pt-2 flex items-center space-x-2">
            <input
              type="password"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
            />
            <button type="submit" className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">
              Save
            </button>
          </form>
        )}

        {/* Face ID / Fingerprint — only meaningful once a PIN exists to fall back to */}
        {pinRequired && (
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <Fingerprint className="w-5 h-5 text-brand-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Face ID / Fingerprint Unlock</p>
                  <p className="text-[11px] text-gray-500">
                    {biometricAvailable ? 'Unlock with your device’s biometrics instead of typing the PIN' : 'Not available on this device or browser'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleBiometric}
                disabled={!biometricAvailable || biometricBusy}
                className={`shrink-0 px-3 py-1.5 min-h-[2.5rem] rounded-xl text-xs font-semibold disabled:opacity-50 ${
                  biometricEnabled
                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40'
                    : 'bg-brand-600 text-white shadow-sm'
                }`}
              >
                {biometricBusy ? 'Setting up...' : biometricEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            {biometricError && <p className="text-[11px] text-red-500 mt-2">{biometricError}</p>}
          </div>
        )}
      </div>

      {/* 4. Browser Notifications */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notifications</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">Browser & PWA Notifications</p>
              <p className="text-[11px] text-gray-500">Get alerts before EMI and Bill due dates</p>
            </div>
          </div>
          <button
            onClick={handleRequestNotifications}
            className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-sm"
          >
            Enable & Test
          </button>
        </div>
      </div>

      {/* 4b. Email alerts + iPhone Calendar sync */}
      <AlertsSettings />

      {/* 5. Data Management — this device's file manager integration */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Management</h2>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 -mt-1">
          Everything is stored only on this device. Back up regularly, and restore the same file on a new phone to move your data over.
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <Database className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white">Backup to Files</p>
              <p className="text-[11px] text-gray-500">Full JSON snapshot, saved via the iPhone share sheet</p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            disabled={dataBusy !== null}
            className="shrink-0 flex items-center gap-1.5 px-3 min-h-[2.5rem] rounded-xl bg-emerald-600 active:bg-emerald-700 text-white text-xs font-semibold shadow-sm disabled:opacity-60"
          >
            {dataBusy === 'backup' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Backup</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <Upload className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-white">Restore from a backup file</p>
              <p className="text-[11px] text-gray-500">Pick a SMT-C_Backup .json from Files</p>
            </div>
          </div>
          <button
            onClick={() => restoreInputRef.current?.click()}
            disabled={dataBusy !== null}
            className="shrink-0 flex items-center gap-1.5 px-3 min-h-[2.5rem] rounded-xl bg-blue-600 active:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-60"
          >
            {dataBusy === 'restore' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>Restore</span>
          </button>
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) handleRestoreFile(file);
            }}
          />
        </div>

        {dataMsg && (
          <p className={`flex items-center gap-1.5 text-[11px] font-medium ${dataMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {dataMsg.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />} {dataMsg.text}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold text-red-600">Reset All Data to 0</p>
            <p className="text-[11px] text-gray-500">Wipe all expenses, loans, cards & start from zero</p>
          </div>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to reset all data to 0? This cannot be undone.')) {
                await api.resetAllData();
                window.location.reload();
              }
            }}
            className="shrink-0 px-3 min-h-[2.5rem] rounded-xl bg-red-600 active:bg-red-700 text-white text-xs font-semibold shadow-sm"
          >
            Reset to 0
          </button>
        </div>
      </div>
    </div>
  );
};
