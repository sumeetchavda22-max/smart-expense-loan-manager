import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * iCalendar (.ics) generation.
 *
 * Opening an .ics on an iPhone shows Apple's "Add to Calendar" sheet, and the VALARMs
 * become native iOS notifications — no push infrastructure needed. A `webcal://`
 * subscription to /api/calendar.ics keeps the phone in sync automatically.
 *
 * Times are written as "floating" local times (no Z / TZID) so 09:00 means 09:00 on
 * whatever timezone the phone is in — which is what a personal bill reminder should do.
 */

const pad = (n: number) => String(n).padStart(2, '0');

const fmtDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

const fmtLocal = (d: Date, time = '09:00') => {
  const [hh, mm] = time.split(':').map((x) => Number(x) || 0);
  return `${fmtDate(d)}T${pad(hh)}${pad(mm)}00`;
};

const fmtUtcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes()
  )}${pad(d.getUTCSeconds())}Z`;

// RFC 5545: escape , ; \ and newlines in text values
const esc = (s: string | null | undefined) =>
  (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// RFC 5545: lines must be folded at 75 octets
const fold = (line: string) => {
  const out: string[] = [];
  let cur = line;
  while (Buffer.byteLength(cur, 'utf8') > 75) {
    let cut = 75;
    while (cut > 0 && Buffer.byteLength(cur.slice(0, cut), 'utf8') > 75) cut--;
    out.push(cur.slice(0, cut));
    cur = ' ' + cur.slice(cut);
  }
  out.push(cur);
  return out.join('\r\n');
};

/** Day-of-month clamped to the month (31 -> 30 for a 30-day month) on/after `from`. */
const nextOccurrenceOfDay = (day: number, from = new Date()): Date => {
  const y = from.getFullYear();
  const m = from.getMonth();
  const inThis = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  if (inThis >= new Date(y, m, from.getDate())) return inThis;
  return new Date(y, m + 1, Math.min(day, new Date(y, m + 2, 0).getDate()));
};

export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  time?: string; // HH:mm local
  rrule?: string; // e.g. FREQ=MONTHLY;COUNT=12
  alarmsMinutesBefore?: number[]; // default: 1 day before + at the time
  categories?: string;
}

const repeatToRrule = (repeat: string | null | undefined): string | undefined => {
  switch ((repeat || 'NONE').toUpperCase()) {
    case 'DAILY':
      return 'FREQ=DAILY';
    case 'WEEKLY':
      return 'FREQ=WEEKLY';
    case 'MONTHLY':
      return 'FREQ=MONTHLY';
    case 'YEARLY':
      return 'FREQ=YEARLY';
    default:
      return undefined;
  }
};

export const buildIcs = (events: IcsEvent[], calName = 'SmartFinance'): string => {
  const now = fmtUtcStamp(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SmartFinance//Smart Expense & Loan Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`,
    'X-WR-CALDESC:EMI, credit card, bill & salary reminders',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  for (const ev of events) {
    const start = fmtLocal(ev.start, ev.time || '09:00');
    const [hh, mm] = (ev.time || '09:00').split(':').map((x) => Number(x) || 0);
    const endDate = new Date(ev.start);
    endDate.setHours(hh, mm + 30, 0, 0); // 30-minute block
    const alarms = ev.alarmsMinutesBefore ?? [24 * 60, 0];

    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${fmtLocal(endDate, `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`)}`,
      `SUMMARY:${esc(ev.title)}`
    );
    if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
    if (ev.categories) lines.push(`CATEGORIES:${esc(ev.categories)}`);
    if (ev.rrule) lines.push(`RRULE:${ev.rrule}`);
    lines.push('TRANSP:TRANSPARENT');
    for (const minutes of alarms) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(ev.title)}`,
        `TRIGGER:${minutes === 0 ? 'PT0M' : `-PT${minutes}M`}`,
        'END:VALARM'
      );
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
};

const money = (currency: string, n: number) => `${currency}${Number(n || 0).toLocaleString('en-IN')}`;

/** A single reminder as an .ics file. */
export const reminderToIcs = async (id: string): Promise<{ ics: string; filename: string } | null> => {
  const [rem, settings] = await Promise.all([
    prisma.reminder.findUnique({ where: { id } }),
    prisma.settings.findUnique({ where: { id: 'default-settings' } }),
  ]);
  if (!rem) return null;
  const currency = settings?.currency || '₹';
  const ics = buildIcs(
    [
      {
        uid: `reminder-${rem.id}@smartfinance`,
        title: `${rem.title} — ${money(currency, rem.amount)}`,
        description: [`Type: ${rem.type}`, `Amount: ${money(currency, rem.amount)}`, rem.notes || '']
          .filter(Boolean)
          .join('\n'),
        start: new Date(rem.dueDate),
        time: rem.dueTime || '09:00',
        rrule: repeatToRrule(rem.repeat),
        categories: 'SmartFinance',
      },
    ],
    'SmartFinance Reminder'
  );
  const safe = rem.title.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'reminder';
  return { ics, filename: `${safe}.ics` };
};

/** Everything with a date: reminders, loan EMIs, credit-card due/statement days, salary credit days. */
export const fullCalendarIcs = async (): Promise<string> => {
  const [reminders, loans, cards, salaries, settings] = await Promise.all([
    prisma.reminder.findMany({ where: { isCompleted: false } }),
    prisma.loan.findMany({ where: { status: 'ACTIVE' } }),
    prisma.creditCard.findMany(),
    prisma.salary.findMany(),
    prisma.settings.findUnique({ where: { id: 'default-settings' } }),
  ]);
  const currency = settings?.currency || '₹';
  const events: IcsEvent[] = [];

  for (const r of reminders) {
    events.push({
      uid: `reminder-${r.id}@smartfinance`,
      title: `${r.title} — ${money(currency, r.amount)}`,
      description: [`Type: ${r.type}`, r.notes || ''].filter(Boolean).join('\n'),
      start: new Date(r.dueDate),
      time: r.dueTime || '09:00',
      rrule: repeatToRrule(r.repeat),
      categories: 'Reminder',
    });
  }

  for (const l of loans) {
    if (!l.remainingEmis || l.remainingEmis <= 0) continue;
    events.push({
      uid: `loan-${l.id}@smartfinance`,
      title: `EMI: ${l.name} — ${money(currency, l.emiAmount)}`,
      description: [l.bankName ? `Bank: ${l.bankName}` : '', `Remaining EMIs: ${l.remainingEmis}`]
        .filter(Boolean)
        .join('\n'),
      start: new Date(l.nextDueDate),
      time: '09:00',
      rrule: `FREQ=MONTHLY;COUNT=${l.remainingEmis}`,
      categories: 'Loan EMI',
    });
  }

  for (const c of cards) {
    events.push({
      uid: `card-due-${c.id}@smartfinance`,
      title: `Card bill due: ${c.cardName}${c.totalDue ? ` — ${money(currency, c.totalDue)}` : ''}`,
      description: `${c.bankName}\nMinimum due: ${money(currency, c.minimumDue)}`,
      start: nextOccurrenceOfDay(c.dueDate),
      time: '09:00',
      rrule: 'FREQ=MONTHLY',
      alarmsMinutesBefore: [2 * 24 * 60, 24 * 60, 0],
      categories: 'Credit Card',
    });
    events.push({
      uid: `card-stmt-${c.id}@smartfinance`,
      title: `Statement: ${c.cardName}`,
      description: `${c.bankName} statement generated`,
      start: nextOccurrenceOfDay(c.statementDate),
      time: '10:00',
      rrule: 'FREQ=MONTHLY',
      alarmsMinutesBefore: [0],
      categories: 'Credit Card',
    });
  }

  for (const s of salaries) {
    events.push({
      uid: `salary-${s.id}@smartfinance`,
      title: `Salary credit: ${s.companyName}`,
      start: nextOccurrenceOfDay(s.salaryDate),
      time: '10:00',
      rrule: 'FREQ=MONTHLY',
      alarmsMinutesBefore: [0],
      categories: 'Salary',
    });
  }

  return buildIcs(events, 'SmartFinance');
};
