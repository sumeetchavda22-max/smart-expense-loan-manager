import { getDb } from './client';

export interface DueItem {
  kind: 'Reminder' | 'Loan EMI' | 'Credit Card';
  title: string;
  amount: number;
  due: Date;
  inDays: number;
  note?: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);

const nextOccurrenceOfDay = (day: number, from: Date): Date => {
  const y = from.getFullYear();
  const m = from.getMonth();
  const inThis = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
  if (inThis >= startOfDay(from)) return inThis;
  return new Date(y, m + 1, Math.min(day, new Date(y, m + 2, 0).getDate()));
};

/** Everything due between today and today+daysAhead — the same logic the old server-side digest used. */
export async function collectDueItems(daysAhead: number, now = new Date()): Promise<DueItem[]> {
  const db = await getDb();
  const [reminders, loans, cards] = await Promise.all([
    db.getAll('reminders'),
    db.getAllFromIndex('loans', 'byStatus', 'ACTIVE'),
    db.getAll('creditCards'),
  ]);

  const items: DueItem[] = [];
  const within = (d: Date) => {
    const n = daysBetween(now, d);
    return n >= 0 && n <= daysAhead ? n : null;
  };

  for (const r of reminders.filter((r) => !r.isCompleted)) {
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
}

export const whenLabel = (n: number) => (n === 0 ? 'TODAY' : n === 1 ? 'Tomorrow' : `In ${n} days`);
const prettyDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const money = (currency: string, n: number) => `${currency}${Number(n || 0).toLocaleString('en-IN')}`;

export const digestSubject = (items: DueItem[]) => {
  const today = items.filter((i) => i.inDays === 0).length;
  return today > 0
    ? `⚠️ ${today} payment${today > 1 ? 's' : ''} due TODAY — SmartFinance`
    : `🔔 ${items.length} upcoming payment${items.length > 1 ? 's' : ''} — SmartFinance`;
};

export const digestText = (items: DueItem[], currency: string) =>
  items.map((i) => `${whenLabel(i.inDays)} (${prettyDate(i.due)}): ${i.title} [${i.kind}] — ${money(currency, i.amount)}`).join('\n');

export const digestHtml = (items: DueItem[], currency: string) => {
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
  </div>`;
};
