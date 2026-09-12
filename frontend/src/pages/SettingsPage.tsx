import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Lock,
  Bell,
  Database,
  Download,
  Upload,
  Globe,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { useAuthPin } from '../context/AuthPinContext';
import { AlertsSettings } from '../components/Settings/AlertsSettings';

export const SettingsPage: React.FC = () => {
  const { theme, setThemeMode } = useTheme();
  const { currency, updateCurrency, triggerNotification } = useFinance();
  const { pinRequired, setPin } = useAuthPin();

  const [newPinInput, setNewPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);

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

  const handleBackup = () => {
    window.open('/api/backup', '_blank');
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

      {/* 5. Database Backup & Local Storage */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Data Management</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">SQLite Database Backup</p>
              <p className="text-[11px] text-gray-500">Download full JSON snapshot of all tables</p>
            </div>
          </div>
          <button
            onClick={handleBackup}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup Now</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold text-red-600">Reset All Data to 0</p>
            <p className="text-[11px] text-gray-500">Wipe all expenses, loans, cards & start from zero</p>
          </div>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to reset all data to 0? This cannot be undone.')) {
                await (await import('../services/api')).resetAllData();
                await (await import('../context/FinanceContext')).useFinance;
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold shadow-sm"
          >
            Reset to 0
          </button>
        </div>
      </div>
    </div>
  );
};
