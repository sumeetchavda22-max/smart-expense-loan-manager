import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { reminderToIcs } from './ics';

const prisma = new PrismaClient();

/**
 * Email reminder alerts.
 *
 * SMTP credentials come from backend/.env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 * SMTP_FROM). The recipient + schedule are user settings (Settings page in the app).
 * A scheduler runs every 15 minutes and sends ONE digest per day, after `emailSendHour`,
 * listing everything due today or within `emailDaysBefore` days.
 */

export const smtpConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransport = () => {
  if (!smtpConfigured()) throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in backend/.env');
  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS (Gmail), 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const fromAddress = () => process.env.SMTP_FROM || `SmartFinance <${process.env.SMTP_USER}>`;

const money = (currency: string, n: number) => `${currency}${Number(n || 0).toLocaleString('en-IN')}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
const prettyDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export interface DueItem {
  kind: 'Reminder' | 'Loan EMI' | 'Credit Card';
  title: string;
  amount: number;
  due: Date;
  inDays: number; // 0 = today
  note?: string;
}

/** Day-of-month on/after `from`, clamped to month length. */
const nextOccurrenceOfDay = (day: number, from: Date): Date => {
  const y = from.getFullYear();
  const m = from.getMonth();
  const inThis = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  if (inThis >= startOfDay(from)) return inThis;
  return new Date(y, m + 1, Math.min(day, new Date(y, m + 2, 0).getDate()));
};

/** Everything due between today and today+daysAhead (inclusive). */
export const collectDueItems = async (daysAhead: number, now = new Date()): Promise<DueItem[]> => {
  const [reminders, loans, cards] = await Promise.all([
    prisma.reminder.findMany({ where: { isCompleted: false } }),
    prisma.loan.findMany({ where: { status: 'ACTIVE' } }),
    prisma.creditCard.findMany(),
  ]);
  const items: DueItem[] = [];
  const within = (d: Date) => {
    const n = daysBetween(now, d);
    return n >= 0 && n <= daysAhead ? n : null;
  };

  for (const r of reminders) {
    const n = within(new Date(r.dueDate));
    if (n !== null) items.push({ kind: 'Reminder', title: r.title, amount: r.amount, due: new Date(r.dueDate), inDays: n, note: r.notes || undefined });
  }
  for (const l of loans) {
    const n = within(new Date(l.nextDueDate));
    if (n !== null) items.push({ kind: 'Loan EMI', title: l.name, amount: l.emiAmount, due: new Date(l.nextDueDate), inDays: n, note: l.bankName || undefined });
  }
  for (const c of cards) {
    if (!c.totalDue || c.totalDue <= 0) continue;
    const due = nextOccurrenceOfDay(c.dueDate, now);
    const n = within(due);
    if (n !== null) items.push({ kind: 'Credit Card', title: `${c.cardName} bill`, amount: c.totalDue, due, inDays: n, note: `Min due ${c.minimumDue}` });
  }
  return items.sort((a, b) => a.inDays - b.inDays || b.amount - a.amount);
};

const whenLabel = (n: number) => (n === 0 ? 'TODAY' : n === 1 ? 'Tomorrow' : `In ${n} days`);

const digestHtml = (items: DueItem[], currency: string) => {
  const total = items.reduce((s, i) => s + i.amount, 0);
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;">
          <div style="font-weight:600;color:#0f172a;">${i.title}</div>
          <div style="font-size:12px;color:#64748b;">${i.kind}${i.note ? ' · ' + i.note : ''}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;white-space:nowrap;color:${i.inDays === 0 ? '#dc2626' : i.inDays === 1 ? '#ea580c' : '#2563eb'};font-weight:600;">
          ${whenLabel(i.inDays)}<div style="font-size:12px;color:#64748b;font-weight:400;">${prettyDate(i.due)}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;font-weight:700;color:#0f172a;white-space:nowrap;">${money(currency, i.amount)}</td>
      </tr>`
    )
    .join('');
  return `
  <div style="font-family:-apple-system,Inter,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:16px;color:#0f172a;">
    <div style="background:linear-gradient(135deg,#006786,#1186ac 55%,#ff458e);border-radius:16px;padding:20px;color:#fff;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">SmartFinance · Due alerts</div>
      <div style="font-size:24px;font-weight:800;margin-top:4px;">${items.length} payment${items.length > 1 ? 's' : ''} coming up</div>
      <div style="font-size:14px;opacity:.9;margin-top:2px;">Total ${money(currency, total)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;background:#fff;border:1px solid #eef2f7;border-radius:12px;overflow:hidden;">
      ${rows}
    </table>
    <p style="font-size:12px;color:#94a3b8;margin-top:14px;">Sent by your Smart Expense &amp; Loan Manager. Change alert settings in the app → Settings → Email alerts.</p>
  </div>`;
};

const digestText = (items: DueItem[], currency: string) =>
  items.map((i) => `${whenLabel(i.inDays)} (${prettyDate(i.due)}): ${i.title} [${i.kind}] — ${money(currency, i.amount)}`).join('\n');

export const sendDigestEmail = async (to: string, items: DueItem[], currency: string) => {
  const transport = getTransport();
  const today = items.filter((i) => i.inDays === 0).length;
  const subject = today > 0 ? `⚠️ ${today} payment${today > 1 ? 's' : ''} due TODAY — SmartFinance` : `🔔 ${items.length} upcoming payment${items.length > 1 ? 's' : ''} — SmartFinance`;
  await transport.sendMail({ from: fromAddress(), to, subject, text: digestText(items, currency), html: digestHtml(items, currency) });
};

export const sendTestEmail = async (to: string) => {
  const transport = getTransport();
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: '✅ SmartFinance email alerts are working',
    text: 'This is a test from your Smart Expense & Loan Manager. You will receive a daily digest of EMIs, bills and reminders that are due.',
    html: `<div style="font-family:-apple-system,Inter,Segoe UI,Roboto,sans-serif;padding:16px;">
      <h2 style="margin:0 0 8px;">✅ Email alerts are working</h2>
      <p style="color:#475569;">You'll get a daily digest of EMIs, credit-card bills and reminders that are due today or in the next few days.</p>
    </div>`,
  });
};

/** Confirmation with the reminder attached as .ics — tap the attachment on iPhone to add it to Calendar. */
export const sendReminderCreatedEmail = async (to: string, reminderId: string, currency: string) => {
  const [rem, file] = await Promise.all([prisma.reminder.findUnique({ where: { id: reminderId } }), reminderToIcs(reminderId)]);
  if (!rem || !file) return;
  const transport = getTransport();
  const due = new Date(rem.dueDate);
  await transport.sendMail({
    from: fromAddress(),
    to,
    subject: `📅 Reminder set: ${rem.title} on ${prettyDate(due)}`,
    text: `${rem.title} — ${money(currency, rem.amount)} due ${prettyDate(due)} at ${rem.dueTime}.\nOpen the attached .ics on your iPhone to add it to Calendar with alerts.`,
    html: `<div style="font-family:-apple-system,Inter,Segoe UI,Roboto,sans-serif;padding:16px;">
      <h2 style="margin:0 0 6px;">📅 ${rem.title}</h2>
      <p style="margin:0;color:#0f172a;font-size:18px;font-weight:700;">${money(currency, rem.amount)}</p>
      <p style="color:#475569;">Due <b>${prettyDate(due)}</b> at ${rem.dueTime}${rem.repeat && rem.repeat !== 'NONE' ? ` · repeats ${rem.repeat.toLowerCase()}` : ''}</p>
      <p style="color:#475569;font-size:13px;">Tap the attached <b>${file.filename}</b> on your iPhone → <b>Add to Calendar</b>. You'll get native alerts 1 day before and at the due time.</p>
    </div>`,
    attachments: [{ filename: file.filename, content: file.ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }],
  });
};

/**
 * Daily digest check — safe to call often; sends at most once per calendar day and only
 * once the local clock has passed `emailSendHour`.
 */
export const runDigestCheck = async (force = false): Promise<{ sent: boolean; reason: string; count?: number }> => {
  const settings = await prisma.settings.findUnique({ where: { id: 'default-settings' } });
  if (!settings) return { sent: false, reason: 'no settings row' };
  if (!settings.emailRemindersEnabled && !force) return { sent: false, reason: 'email alerts disabled' };
  if (!settings.notifyEmail) return { sent: false, reason: 'no notification email set' };
  if (!smtpConfigured()) return { sent: false, reason: 'SMTP not configured in backend/.env' };

  const now = new Date();
  const today = ymd(now);
  if (!force) {
    if (settings.lastEmailDigestDate === today) return { sent: false, reason: 'already sent today' };
    if (now.getHours() < (settings.emailSendHour ?? 8)) return { sent: false, reason: `waiting for ${settings.emailSendHour}:00` };
  }

  const items = await collectDueItems(settings.emailDaysBefore ?? 1, now);
  if (items.length === 0) {
    if (!force) await prisma.settings.update({ where: { id: 'default-settings' }, data: { lastEmailDigestDate: today } });
    return { sent: false, reason: 'nothing due', count: 0 };
  }

  await sendDigestEmail(settings.notifyEmail, items, settings.currency || '₹');
  await prisma.settings.update({ where: { id: 'default-settings' }, data: { lastEmailDigestDate: today } });
  console.log(`📧 Due-payment digest sent to ${settings.notifyEmail} (${items.length} item(s))`);
  return { sent: true, reason: 'sent', count: items.length };
};

let timer: NodeJS.Timeout | null = null;

/** Start the background scheduler (every 15 min, first run shortly after boot). */
export const startNotificationScheduler = () => {
  if (timer) return;
  const tick = () => runDigestCheck().catch((e) => console.error('Digest check failed:', e.message));
  setTimeout(tick, 15_000);
  timer = setInterval(tick, 15 * 60 * 1000);
  console.log(`📧 Email digest scheduler started (${smtpConfigured() ? 'SMTP configured' : 'SMTP NOT configured — set SMTP_* in backend/.env'})`);
};
