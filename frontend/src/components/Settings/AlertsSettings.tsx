import React, { useEffect, useState } from 'react';
import { Mail, Send, CalendarPlus, RefreshCw, CheckCircle2, AlertTriangle, MailPlus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import * as api from '../../services/api';
import { NotificationStatus } from '../../types/finance';

const fieldCls =
  'w-full px-3 py-2.5 min-h-[2.75rem] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500';

/** Settings → "Email alerts" and "iPhone Calendar" cards. Both work entirely from on-device data. */
export const AlertsSettings: React.FC = () => {
  const { settings, currency, refreshData } = useFinance();

  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [daysBefore, setDaysBefore] = useState(1);
  const [sendHour, setSendHour] = useState(8);
  const [status, setStatus] = useState<NotificationStatus | null>(null);
  const [busy, setBusy] = useState<'save' | 'test' | 'now' | 'mailto' | 'ics' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!settings) return;
    setEmail(settings.notifyEmail || '');
    setEnabled(!!settings.emailRemindersEnabled);
    setDaysBefore(settings.emailDaysBefore ?? 1);
    setSendHour(settings.emailSendHour ?? 8);
  }, [settings]);

  const loadStatus = () => api.fetchNotificationStatus().then(setStatus).catch(() => setStatus(null));
  useEffect(() => {
    loadStatus();
  }, []);

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    window.setTimeout(() => setMsg(null), 6000);
  };

  const handleSave = async () => {
    setBusy('save');
    try {
      await api.updateSettings({
        notifyEmail: email.trim() || null,
        emailRemindersEnabled: enabled && !!email.trim(),
        emailDaysBefore: daysBefore,
        emailSendHour: sendHour,
      });
      await refreshData();
      await loadStatus();
      flash(true, 'Email alert settings saved.');
    } catch (e: any) {
      flash(false, e.message || 'Could not save');
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    if (!email.trim()) return flash(false, 'Enter your email address first.');
    setBusy('test');
    try {
      await api.sendTestEmail(email.trim());
      flash(true, `Test email sent to ${email.trim()}. Check your inbox (and spam).`);
    } catch (e: any) {
      flash(false, e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleSendNow = async () => {
    setBusy('now');
    try {
      const r = await api.sendDigestNow();
      flash(r.sent, r.sent ? `Digest sent (${r.count} item${r.count === 1 ? '' : 's'}).` : `Not sent: ${r.reason}.`);
      await loadStatus();
    } catch (e: any) {
      flash(false, e.message);
    } finally {
      setBusy(null);
    }
  };

  const handleMailto = async () => {
    setBusy('mailto');
    try {
      await api.composeMailto();
    } finally {
      setBusy(null);
    }
  };

  const handleAddAllToCalendar = async () => {
    setBusy('ics');
    try {
      await api.downloadFullCalendar(currency);
      flash(true, 'Calendar file saved — open it and tap "Add to Calendar".');
    } catch (e: any) {
      flash(false, e.message);
    } finally {
      setBusy(null);
    }
  };

  const relayReady = status?.smtpConfigured === true;

  return (
    <>
      {/* Email alerts */}
      <div className="p-4 xs:p-5 rounded-2xl liquid-glass-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email alerts</h2>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-snug">
            Your data never leaves this device, so there's no server watching the clock for you. Use <b>Compose in Mail</b> any
            time — it always works, no setup. <b>Auto-send</b> below needs a small optional relay deployed (see README); it only
            forwards the digest this phone already computed, it never stores anything.
          </p>
        </div>

        {status && !relayReady && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Auto-send relay isn't deployed/configured — "Send test" and "Send now" won't work until it is. "Compose in Mail" always works.</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Send alerts to</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Alert me</label>
            <select value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))} className={fieldCls}>
              <option value={0}>On the due day only</option>
              <option value={1}>1 day before + due day</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
              <option value={7}>1 week before</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Send time</label>
            <select value={sendHour} onChange={(e) => setSendHour(Number(e.target.value))} className={fieldCls}>
              {[6, 7, 8, 9, 10, 12, 18, 20].map((h) => (
                <option key={h} value={h}>
                  {h > 12 ? `${h - 12}:00 PM` : h === 12 ? '12:00 PM' : `${h}:00 AM`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={busy !== null}
          className="w-full min-h-[2.75rem] rounded-xl bg-brand-600 active:bg-brand-700 text-white text-xs font-semibold shadow-md disabled:opacity-60"
        >
          {busy === 'save' ? 'Saving…' : 'Save'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleMailto}
            disabled={busy !== null || !email.trim()}
            className="flex-1 min-h-[2.75rem] rounded-xl bg-gray-800 dark:bg-slate-700 active:bg-gray-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <MailPlus className="w-3.5 h-3.5" /> Compose in Mail
          </button>
          <button
            onClick={handleTest}
            disabled={busy !== null || !relayReady}
            title={relayReady ? 'Send a test email now' : 'Deploy the relay first (see README)'}
            className="flex-1 min-h-[2.75rem] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" /> {busy === 'test' ? 'Sending…' : 'Send test'}
          </button>
          <button
            onClick={handleSendNow}
            disabled={busy !== null || !relayReady}
            title={relayReady ? "Send today's digest now" : 'Deploy the relay first (see README)'}
            aria-label="Send today's digest now"
            className="w-11 min-h-[2.75rem] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 flex items-center justify-center disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${busy === 'now' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {msg && (
          <p className={`flex items-center gap-1.5 text-[11px] font-medium ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {msg.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />} {msg.text}
          </p>
        )}
        {status && (
          <p className="text-[11px] text-gray-400">
            {status.dueNow} item{status.dueNow === 1 ? '' : 's'} due in the next {status.daysBefore} day{status.daysBefore === 1 ? '' : 's'}
            {status.lastDigestDate ? ` · last digest ${status.lastDigestDate}` : ' · no digest sent yet'}
          </p>
        )}
      </div>

      {/* iPhone Calendar */}
      <div className="p-4 xs:p-5 rounded-2xl liquid-glass-card space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">iPhone Calendar</h2>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 shrink-0">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-snug">
            Put every reminder, loan EMI, card due date and salary day into the iPhone's own Calendar — native iOS alerts, even
            when this app is closed. Since your data lives only here, there's no auto-syncing feed: tap this again after making
            changes to refresh it.
          </p>
        </div>
        <button
          onClick={handleAddAllToCalendar}
          disabled={busy !== null}
          className="w-full min-h-[2.75rem] rounded-xl bg-rose-500 active:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60"
        >
          <CalendarPlus className="w-4 h-4" /> {busy === 'ics' ? 'Preparing…' : 'Add all to Calendar'}
        </button>
      </div>
    </>
  );
};
