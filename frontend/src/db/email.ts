import { collectDueItems, digestHtml, digestSubject, digestText, whenLabel } from './dueItems';
import { getSettings, updateSettings } from './repo';

/**
 * Two ways to get an email out of a fully on-device app — browsers cannot open an
 * authenticated SMTP connection themselves, so *some* bridge is unavoidable for real
 * email:
 *
 *  1. `composeMailto()` — always works, zero setup: opens the iPhone Mail app with the
 *     digest pre-filled. You review and hit Send yourself.
 *  2. `sendViaRelay()` — fully automatic, but needs the optional `api/send-email`
 *     serverless function deployed (see README) with SMTP_* set as Vercel env vars.
 *     The relay is stateless: it only forwards the text this device already computed,
 *     it holds no database of its own.
 */

const RELAY_URL = '/api/send-email';

export async function relayStatus(): Promise<{ available: boolean; configured: boolean }> {
  try {
    const res = await fetch(RELAY_URL, { method: 'GET' });
    if (!res.ok) return { available: false, configured: false };
    const data = await res.json();
    return { available: true, configured: !!data.configured };
  } catch {
    return { available: false, configured: false };
  }
}

async function postRelay(payload: { to: string; subject: string; text: string; html: string; icsFilename?: string; icsContent?: string }) {
  const res = await fetch(RELAY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'The email relay is not deployed. Use "Compose in Mail" instead, or see README to enable auto-send.');
  return data;
}

export async function sendTestEmail(to: string) {
  return postRelay({
    to,
    subject: '✅ SMT-C email alerts are working',
    text: 'This confirms your SMT-C relay is working. You will get a digest of what is due whenever you open the app.',
    html: `<div style="font-family:-apple-system,Inter,Segoe UI,Roboto,sans-serif;padding:16px;"><h2>✅ Email alerts are working</h2><p style="color:#475569;">You'll get a digest of EMIs, card bills and reminders due soon, whenever you open the app.</p></div>`,
  });
}

/** Checks what's due and — if enabled + relay available — sends today's digest (once per day). */
export async function checkAndSendDigestIfDue(): Promise<{ sent: boolean; reason: string; count?: number }> {
  const settings = await getSettings();
  if (!settings.emailRemindersEnabled) return { sent: false, reason: 'disabled' };
  if (!settings.notifyEmail) return { sent: false, reason: 'no email set' };

  const today = new Date().toISOString().slice(0, 10);
  if (settings.lastEmailDigestDate === today) return { sent: false, reason: 'already sent today' };
  if (new Date().getHours() < (settings.emailSendHour ?? 8)) return { sent: false, reason: 'too early' };

  const items = await collectDueItems(settings.emailDaysBefore ?? 1);
  if (items.length === 0) {
    await updateSettings({ lastEmailDigestDate: today });
    return { sent: false, reason: 'nothing due', count: 0 };
  }

  const { available } = await relayStatus();
  if (!available) return { sent: false, reason: 'relay not deployed', count: items.length };

  await postRelay({
    to: settings.notifyEmail,
    subject: digestSubject(items),
    text: digestText(items, settings.currency || '₹'),
    html: digestHtml(items, settings.currency || '₹'),
  });
  await updateSettings({ lastEmailDigestDate: today });
  return { sent: true, reason: 'sent', count: items.length };
}

/** Manual "send now" button in Settings — ignores the once-per-day dedupe. */
export async function sendDigestNow() {
  const settings = await getSettings();
  if (!settings.notifyEmail) throw new Error('Set a notification email first.');
  const items = await collectDueItems(settings.emailDaysBefore ?? 1);
  if (items.length === 0) return { sent: false, reason: 'nothing due', count: 0 };

  await postRelay({
    to: settings.notifyEmail,
    subject: digestSubject(items),
    text: digestText(items, settings.currency || '₹'),
    html: digestHtml(items, settings.currency || '₹'),
  });
  await updateSettings({ lastEmailDigestDate: new Date().toISOString().slice(0, 10) });
  return { sent: true, reason: 'sent', count: items.length };
}

/** Zero-setup fallback: opens the iPhone Mail app with the digest pre-filled. */
export async function composeMailto(daysAhead = 3) {
  const settings = await getSettings();
  const items = await collectDueItems(daysAhead);
  const to = settings.notifyEmail || '';
  const subject = items.length ? digestSubject(items) : 'SMT-C — nothing due soon';
  const body = items.length
    ? items.map((i) => `${whenLabel(i.inDays)}: ${i.title} (${i.kind}) — ${settings.currency}${i.amount.toLocaleString('en-IN')}`).join('\n')
    : 'Nothing due in the next few days.';
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
